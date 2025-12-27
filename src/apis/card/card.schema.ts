import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
extendZodWithOpenApi(z)

const optionalNullableString = z.string().min(1).optional().nullable()

export const CreateCardSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    listId: z.string().uuid('Invalid List ID'),
    description: optionalNullableString,
    coverUrl: z.string().url('Invalid URL').optional().nullable(),
    dueDate: z
        .string()
        .optional()
        .nullable()
        .refine(
            (val) => {
                if (val === undefined || val === null || val === '') return true
                const t = Date.parse(val)
                return !Number.isNaN(t)
            },
            { message: 'Invalid date format (use ISO string)' }
        ),
    priority: z.enum(['low', 'medium', 'high']).optional().default('medium')
})
