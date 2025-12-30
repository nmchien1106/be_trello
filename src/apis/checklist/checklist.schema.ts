import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const CreateChecklistSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    cardId: z.string().uuid('Invalid Card ID')
})

export const UpdateChecklistSchema = z.object({
    title: z.string().min(1, 'Title is required')
})

export const CreateChecklistItemSchema = z.object({
    content: z.string().min(1, 'Content is required'),
    checklistId: z.string().uuid('Invalid Checklist ID')
})

export const UpdateChecklistItemSchema = z.object({
    content: z.string().min(1).optional(),
    isChecked: z.boolean().optional()
})