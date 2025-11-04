import { z } from 'zod';
import { instanceParameterSchema } from './common-schemas.js';

// Basic schema for listar usuários (no parameters)
export const listUsersSchema = z.object({
  ...instanceParameterSchema,
});

// Schema for obter detalhes de um usuário específico
export const getUserSchema = z.object({
  user_id: z.number().describe('The ID of the user'),
  ...instanceParameterSchema,
});

// Schema for obter usuário atual (no parameters)
export const getCurrentUserSchema = z.object({
  ...instanceParameterSchema,
});
