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

    cardRegistry.registerPath({
        method: 'patch',
        path: '/api/cards/{id}',
        tags: ['Card'],
        summary: 'Update a card',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() }),
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            title: z.string().optional(),
                            description: z.string().optional(),
                            dueDate: z.string().optional(),
                            isArchived: z.boolean().optional()
                        })
                    }
                }
            }
        },
        responses: {
            ...createApiResponse(z.object({}), 'Card updated successfully', Status.OK)
        }
    })

    cardRegistry.registerPath({
        method: 'delete',
        path: '/api/cards/{id}',
        tags: ['Card'],
        summary: 'Delete a card',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() })
        },
        responses: {
            ...createApiResponse(z.object({}), 'Card deleted successfully', Status.OK)
        }
    })

    cardRegistry.registerPath({
        method: 'post',
        path: '/api/cards/{id}/members',
        tags: ['Card'],
        summary: 'Add member to card',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() }),
            body: {
                content: {
                    'application/json': { schema: z.object({ memberId: z.string().uuid() }) }
                }
            }
        },
        responses: {
            ...createApiResponse(
                z.object({
                    id: z.string(),
                    card: z.object({ id: z.string() }),
                    user: z.object({ id: z.string(), name: z.string(), email: z.string() })
                }),
                'Member added to card successfully',
                Status.CREATED
            )
        }
    })

    cardRegistry.registerPath({
        method: 'get',
        path: '/api/cards/{id}/members',
        tags: ['Card'],
        summary: 'Get members of a card',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() })
        },
        responses: {
            ...createApiResponse(z.array(z.object()), 'Card members retrieved successfully', Status.OK)
        }
    })

    // Remove member from card
    cardRegistry.registerPath({
        method: 'delete',
        path: '/api/cards/{id}/members',
        tags: ['Card'],
        summary: 'Remove member from card',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() }),
            body: {
                content: {
                    'application/json': { schema: z.object({ memberId: z.string().uuid() }) }
                }
            }
        },
        responses: {
            200: { description: 'Member removed from card successfully' }
        }
    })

}
