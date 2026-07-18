import argon2 from 'argon2';
import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock('../../src/shared/prisma/client.js', () => ({
  prisma: { user: { findUnique }, $disconnect: vi.fn() }
}));

const activeUser = {
  id: '4bc3bf99-c469-4aec-a45e-213c332e9c5b',
  name: 'Administrador',
  email: 'admin@example.com',
  passwordHash: '',
  role: 'ADMIN' as const,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

function firstSetCookie(response: request.Response): string {
  const cookies = response.headers['set-cookie'];
  const cookie = Array.isArray(cookies) ? cookies[0] : cookies;
  if (cookie === undefined) throw new Error('Resposta sem Set-Cookie');
  return cookie;
}

describe('autenticacao', () => {
  let app: Express;

  beforeAll(async () => {
    activeUser.passwordHash = await argon2.hash('correct-password', { type: argon2.argon2id });
    const module = await import('../../src/app/create-app.js');
    app = module.createApp();
  });

  it('realiza login com credenciais validas sem expor o hash', async () => {
    findUnique.mockResolvedValueOnce(activeUser);

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'ADMIN@example.com', password: 'correct-password' });

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      id: activeUser.id,
      name: activeUser.name,
      email: activeUser.email,
      role: activeUser.role,
      active: true
    });
    expect(response.body.user).not.toHaveProperty('passwordHash');
    const cookie = firstSetCookie(response);
    expect(cookie).toContain('mjm_auth=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it.each([
    ['senha invalida', activeUser, 'wrong-password'],
    ['usuario inexistente', null, 'any-password'],
    ['usuario inativo', { ...activeUser, active: false }, 'correct-password']
  ])('recusa %s com mensagem uniforme', async (_label, user, password) => {
    findUnique.mockResolvedValueOnce(user);

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@example.com', password });

    expect(response.status).toBe(401);
    expect(response.body.error).toEqual({
      code: 'INVALID_CREDENTIALS',
      message: 'E-mail ou senha invalidos'
    });
  });

  it('consulta o usuario autenticado', async () => {
    findUnique.mockResolvedValueOnce(activeUser);
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ email: activeUser.email, password: 'correct-password' });
    const cookie = firstSetCookie(loginResponse).split(';')[0];
    if (cookie === undefined) throw new Error('Cookie invalido');
    findUnique.mockResolvedValueOnce(activeUser);

    const response = await request(app).get('/auth/me').set('Cookie', cookie);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(activeUser.email);
  });

  it('recusa rota privada sem autenticacao', async () => {
    const response = await request(app).get('/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('recusa JWT invalido', async () => {
    const response = await request(app).get('/auth/me').set('Cookie', 'mjm_auth=invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('recusa usuario desativado depois da emissao do JWT', async () => {
    findUnique.mockResolvedValueOnce(activeUser);
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ email: activeUser.email, password: 'correct-password' });
    const cookie = firstSetCookie(loginResponse).split(';')[0];
    if (cookie === undefined) throw new Error('Cookie invalido');
    findUnique.mockResolvedValueOnce({ ...activeUser, active: false });

    const response = await request(app).get('/auth/me').set('Cookie', cookie);

    expect(response.status).toBe(401);
  });

  it('realiza logout removendo o cookie', async () => {
    const response = await request(app).post('/auth/logout');

    expect(response.status).toBe(204);
    expect(firstSetCookie(response)).toContain('mjm_auth=;');
  });

  it('recusa origem nao permitida em operacao mutavel', async () => {
    const response = await request(app)
      .post('/auth/logout')
      .set('Origin', 'https://attacker.example');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('INVALID_ORIGIN');
  });
});
