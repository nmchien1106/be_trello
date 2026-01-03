import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { LabelColor } from '@/enums/label.enum'

extendZodWithOpenApi(z)

export const CreateLabelParamSchema = z.object({
    cardId: z.string().uuid().openapi({
        description: 'Card ID'
    })
})

export const CreateLabelBodySchema = z.object({
    color: z.nativeEnum(LabelColor).openapi({
        description: 'Label color'
    }),
    name: z.string().optional().openapi({
        description: 'Label name'
    })
})

export const CreateLabelResponseSchema = z.object({
    id: z.string().uuid(),
    color: z.nativeEnum(LabelColor),
    name: z.string().nullable()
})

export const UpdateLabelBodySchema = z.object({
    color: z.nativeEnum(LabelColor).optional(),
    name: z.string().max(100).optional()
})
