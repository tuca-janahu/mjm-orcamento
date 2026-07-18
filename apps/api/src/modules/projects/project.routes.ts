import { Router } from 'express';
import { create, index, remove, show, update } from './project.controller.js';

export const projectRouter = Router();
projectRouter.get('/', index);
projectRouter.post('/', create);
projectRouter.get('/:id', show);
projectRouter.patch('/:id', update);
projectRouter.delete('/:id', remove);

