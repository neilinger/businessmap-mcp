import { z } from 'zod';
import { SharedParams } from './shared-params.js';

// Schema for obter detalhes de um custom field específico
export const getCustomFieldSchema = z.object({
  custom_field_id: z.number().describe('The ID of the custom field'),
  instance: SharedParams.shape.instance,
});

// Custom field type enumeration
export const customFieldTypeSchema = z.enum([
  'text',
  'number',
  'date',
  'dropdown',
  'checkbox',
  'user',
  'card',
  'single_line_text',
  'multi_line_text',
]);

// Schema for listing all custom fields
export const listCustomFieldsSchema = z.object({
  page: z.number().min(1).optional().describe('Page number for pagination'),
  page_size: z.number().min(1).max(100).optional().describe('Number of items per page'),
  field_type: customFieldTypeSchema.optional().describe('Filter by field type'),
  instance: SharedParams.shape.instance,
});

// Schema for listing board custom fields
export const listBoardCustomFieldsSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  instance: SharedParams.shape.instance,
});

// Schema for creating a custom field
export const createCustomFieldSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  name: z.string().min(1).describe('The name of the custom field'),
  field_type: customFieldTypeSchema.describe('The type of the custom field'),
  description: z.string().optional().describe('Optional description for the custom field'),
  is_required: z.boolean().optional().describe('Whether the field is required'),
  position: z.number().optional().describe('Display position of the field'),
  options: z
    .array(
      z.object({
        value: z.string().describe('Option value'),
        color: z.string().describe('Option color (hex format)'),
      })
    )
    .optional()
    .describe('Options for dropdown fields'),
  validation: z
    .object({
      min: z.number().optional().describe('Minimum value for number fields'),
      max: z.number().optional().describe('Maximum value for number fields'),
    })
    .optional()
    .describe('Validation rules for number fields'),
  instance: SharedParams.shape.instance,
});

// Schema for updating a custom field
export const updateCustomFieldSchema = z.object({
  custom_field_id: z.number().describe('The ID of the custom field to update'),
  name: z.string().min(1).optional().describe('Updated name'),
  description: z.string().optional().describe('Updated description'),
  is_required: z.boolean().optional().describe('Updated required flag'),
  position: z.number().optional().describe('Updated display position'),
  options: z
    .array(
      z.object({
        id: z.number().optional().describe('Existing option ID (for updates)'),
        value: z.string().describe('Option value'),
        color: z.string().describe('Option color (hex format)'),
      })
    )
    .optional()
    .describe('Updated options for dropdown fields'),
  validation: z
    .object({
      min: z.number().optional().describe('Minimum value for number fields'),
      max: z.number().optional().describe('Maximum value for number fields'),
    })
    .optional()
    .describe('Updated validation rules'),
  instance: SharedParams.shape.instance,
});

// Schema for deleting a custom field
export const deleteCustomFieldSchema = z.object({
  custom_field_id: z.number().describe('The ID of the custom field to delete'),
  instance: SharedParams.shape.instance,
});
