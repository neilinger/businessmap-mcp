import { z } from 'zod';
import { SharedParams } from './shared-params.js';

// Basic schema for listar usuários (no parameters)
export const listUsersSchema = z.object({
  instance: SharedParams.shape.instance,
});

// Schema for obter detalhes de um usuário específico
export const getUserSchema = z.object({
  user_id: z.number().describe('The ID of the user'),
  instance: SharedParams.shape.instance,
});

// Schema for obter usuário atual (no parameters)
export const getCurrentUserSchema = z.object({
  instance: SharedParams.shape.instance,
});
