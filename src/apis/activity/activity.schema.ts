import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const pagination = z.object({
    page: z.coerce.number().int().min(1).default(1),
    size: z.coerce.number().int().min(1).max(100).default(10)
})

export const GetActivitiesByBoardSchema = z.object({
    params: z.object({
        boardId: z.string().uuid('Invalid board ID')
    }),
    query: pagination
})

export const GetActivitiesByCardSchema = z.object({
    params: z.object({
        cardId: z.string().uuid('Invalid card ID')
    }),
    query: pagination
})

export const GetActivitySchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid activity ID')
    })
})

export const DeleteActivitySchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid activity ID')
    })
})

export const GetActivitiesByUserSchema = z.object({
    query: pagination
})

export const GetActivitiesByCommentSchema = z.object({
    params: z.object({
        commentId: z.string().uuid('Invalid comment ID')
    }),
    query: pagination
})
