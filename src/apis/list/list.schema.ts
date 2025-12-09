import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const CreateListSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  boardId: z.string().uuid('Invalid Board ID')
});

export const UpdateListSchema = z.object({
  title: z.string().min(1).optional(),
  isArchived: z.boolean().optional()
});
