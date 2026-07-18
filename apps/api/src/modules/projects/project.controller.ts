import type { RequestHandler } from 'express';
import { createProjectInputSchema, updateProjectInputSchema } from '@mjm/shared';
import { AppError } from '../../shared/errors/app-error.js';
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject
} from './project.service.js';

function authenticatedUserId(request: Parameters<RequestHandler>[0]): string {
  if (request.authUser === undefined) throw new AppError(401, 'UNAUTHENTICATED', 'Autenticacao necessaria');
  return request.authUser.id;
}

function routeParam(request: Parameters<RequestHandler>[0], name: string): string {
  const value = request.params[name];
  if (typeof value !== 'string') throw new AppError(400, 'INVALID_ROUTE_PARAMETER', 'Parametro de rota invalido');
  return value;
}

export const index: RequestHandler = async (_request, response, next) => {
  try { response.json({ projects: await listProjects() }); } catch (error) { next(error); }
};

export const show: RequestHandler = async (request, response, next) => {
  try { response.json({ project: await getProject(routeParam(request, 'id')) }); } catch (error) { next(error); }
};

export const create: RequestHandler = async (request, response, next) => {
  try {
    const project = await createProject(createProjectInputSchema.parse(request.body), authenticatedUserId(request));
    response.status(201).json({ project });
  } catch (error) { next(error); }
};

export const update: RequestHandler = async (request, response, next) => {
  try {
    const project = await updateProject(routeParam(request, 'id'), updateProjectInputSchema.parse(request.body));
    response.json({ project });
  } catch (error) { next(error); }
};

export const remove: RequestHandler = async (request, response, next) => {
  try {
    await deleteProject(routeParam(request, 'id'));
    response.status(204).send();
  } catch (error) { next(error); }
};
