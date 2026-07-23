import type { RequestHandler } from 'express';
import { createProjectInputSchema, updateProjectInputSchema } from '@mjm/shared';
import { authenticatedUserId, routeUuidParam } from '../../shared/http/request-helpers.js';
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject
} from './project.service.js';

export const index: RequestHandler = async (_request, response, next) => {
  try { response.json({ projects: await listProjects() }); } catch (error) { next(error); }
};

export const show: RequestHandler = async (request, response, next) => {
  try { response.json({ project: await getProject(routeUuidParam(request, 'id')) }); } catch (error) { next(error); }
};

export const create: RequestHandler = async (request, response, next) => {
  try {
    const project = await createProject(createProjectInputSchema.parse(request.body), authenticatedUserId(request));
    response.status(201).json({ project });
  } catch (error) { next(error); }
};

export const update: RequestHandler = async (request, response, next) => {
  try {
    const project = await updateProject(routeUuidParam(request, 'id'), updateProjectInputSchema.parse(request.body));
    response.json({ project });
  } catch (error) { next(error); }
};

export const remove: RequestHandler = async (request, response, next) => {
  try {
    await deleteProject(routeUuidParam(request, 'id'));
    response.status(204).send();
  } catch (error) { next(error); }
};
