import type { z } from 'zod';
import type { loginInputSchema } from '../schemas/auth.js';

export type LoginInput = z.infer<typeof loginInputSchema>;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  active: boolean;
}
