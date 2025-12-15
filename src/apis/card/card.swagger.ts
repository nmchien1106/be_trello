import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { CreateCardSchema } from './card.schema'
import { createApiResponse } from '@/api-docs/openApiResponseBuilder'
import { Status } from '@/types/response'

extendZodWithOpenApi(z)

export const cardRegistry = new OpenAPIRegistry()

export const cardsRegisterPath = () => {
    cardRegistry.registerPath({
        method: 'post',
        path: '/api/cards',
        tags: ['Card'],
        summary: 'Create a new card',
        security: [{ bearerAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': { schema: CreateCardSchema }
                }
            }
        },
        responses: {
            ...createApiResponse(z.object({ id: z.string() }), 'Card created successfully', Status.CREATED)
        }
    })

    cardRegistry.registerPath({
        method: 'get',
        path: '/api/cards/list/{listId}',
        tags: ['Card'],
        summary: 'Get all cards in a list',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ listId: z.string().uuid() })
        },
        responses: {
            ...createApiResponse(z.array(z.any()), 'Get cards successfully', Status.OK)
        }
    })
}