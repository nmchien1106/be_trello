import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { GetActivitiesByBoardSchema, GetActivitiesByCardSchema } from './activity.schema'
import { createApiResponse } from '@/api-docs/openApiResponseBuilder'
import { Status } from '@/types/response'

extendZodWithOpenApi(z)

export const activityRegistry = new OpenAPIRegistry()

export const activitiesRegisterPath = () => {
    activityRegistry.registerPath({
        method: 'get',
        path: '/api/activities/board/{boardId}',
        tags: ['Activity'],
        summary: 'Get activity log for a board',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ boardId: z.string().uuid() }),
            query: z.object({
                page: z.string().optional(),
                size: z.string().optional()
            })
        },
        responses: createApiResponse(z.array(z.any()), 'Activities retrieved', Status.OK)
    })

    activityRegistry.registerPath({
        method: 'get',
        path: '/api/activities/card/{cardId}',
        tags: ['Activity'],
        summary: 'Get activity log for a card',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ cardId: z.string().uuid() }),
            query: z.object({
                page: z.string().optional(),
                size: z.string().optional()
            })
        },
        responses: createApiResponse(z.array(z.any()), 'Activities retrieved', Status.OK)
    })

    // get by id
    activityRegistry.registerPath({
        method: 'get',
        path: '/api/activities/{id}',
        tags: ['Activity'],
        summary: 'Get single activity by ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() })
        },
        responses: createApiResponse(z.any(), 'Activity fetched', Status.OK)
    })

    activityRegistry.registerPath({
        method: 'delete',
        path: '/api/activities/{id}',
        tags: ['Activity'],
        summary: 'Delete activity',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() })
        },
        responses: {
            204: {
                description: 'Activity deleted'
            }
        }
    })

    activityRegistry.registerPath({
        method: 'get',
        path: '/api/activities/user',
        tags: ['Activity'],
        summary: 'Get activity log for a user',
        security: [{ bearerAuth: [] }],
        request: {
            query: z.object({ page: z.string().optional(), size: z.string().optional() })
        },
        responses: createApiResponse(z.array(z.any()), 'Activities retrieved', Status.OK)
    })

    activityRegistry.registerPath({
        method: 'get',
        path: '/api/activities/comment/{commentId}',
        tags: ['Activity'],
        summary: 'Get activity log for a comment',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ commentId: z.string().uuid() }),
            query: z.object({ page: z.string().optional(), size: z.string().optional() })
        },
        responses: createApiResponse(z.array(z.any()), 'Activities retrieved', Status.OK)
    })
}
