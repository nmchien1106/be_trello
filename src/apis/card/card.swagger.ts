import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { 
    CreateCardSchema, 
    ReorderCardSchema, 
    DuplicateCardSchema, 
    MoveCardToBoardSchema 
} from './card.schema'
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

    // Reorder
    cardRegistry.registerPath({
        method: 'post',
        path: '/api/cards/{id}/reorder',
        tags: ['Card'],
        summary: 'Reorder card (Drag & Drop)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() }),
            body: { content: { 'application/json': { schema: ReorderCardSchema } } }
        },
        responses: { ...createApiResponse(z.any(), 'Card reordered', Status.OK) }
    })

    // Move to Board
    cardRegistry.registerPath({
        method: 'post',
        path: '/api/cards/{id}/move',
        tags: ['Card'],
        summary: 'Move card to another board',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() }),
            body: { content: { 'application/json': { schema: MoveCardToBoardSchema } } }
        },
        responses: { ...createApiResponse(z.any(), 'Card moved', Status.OK) }
    })

    // Duplicate
    cardRegistry.registerPath({
        method: 'post',
        path: '/api/cards/{id}/duplicate',
        tags: ['Card'],
        summary: 'Duplicate card',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() }),
            body: { content: { 'application/json': { schema: DuplicateCardSchema } } }
        },
        responses: { ...createApiResponse(z.any(), 'Card duplicated', Status.CREATED) }
    })
    
    // Archive
    cardRegistry.registerPath({
        method: 'patch',
        path: '/api/cards/{id}/archive',
        tags: ['Card'],
        summary: 'Archive a card',
        security: [{ bearerAuth: [] }],
        request: { params: z.object({ id: z.string().uuid() }) },
        responses: { ...createApiResponse(z.any(), 'Card archived', Status.OK) }
    })

    // Unarchive
    cardRegistry.registerPath({
        method: 'patch',
        path: '/api/cards/{id}/unarchive',
        tags: ['Card'],
        summary: 'Unarchive a card',
        security: [{ bearerAuth: [] }],
        request: { params: z.object({ id: z.string().uuid() }) },
        responses: { ...createApiResponse(z.any(), 'Card unarchived', Status.OK) }
    })
}