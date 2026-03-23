import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { LabelColor } from '@/enums/label.enum'

extendZodWithOpenApi(z)

export const CreateLabelParamSchema = z.object({
    cardId: z.string().uuid().openapi({
        description: 'Card ID'
    })
})

export const BoardLabelParamSchema = z.object({
    boardId: z.string().uuid().openapi({
        description: 'Board ID'
    })
})

export const AssignExistingLabelBodySchema = z.object({
    labelId: z.string().uuid().openapi({
        description: 'Existing label ID to assign'
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

export const LabelSchema = z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    color: z.nativeEnum(LabelColor),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
})

export const GetLabelsOnCardResponseSchema = z.array(LabelSchema)
