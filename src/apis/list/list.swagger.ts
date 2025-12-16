import { z } from 'zod'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
extendZodWithOpenApi(z)

export const listRegistry = new OpenAPIRegistry()

export const ListRegisterPaths = () => {
    // Post /api/lists/:listId/reorder --> change position of a list
    listRegistry.registerPath({
        method: 'post',
        path: '/api/lists/{listId}/reorder',
        description: 'Change position of a list',
        summary: 'Reorder a list within a board',
        tags: ['Lists'],
        request: {
            params: z.object({
                listId: z.string().openapi({ description: 'ID of the list to reorder' })
            }),
            body: {
                description: 'Reorder List Payload',
                content: {
                    'application/json': {
                        schema: z.object({
                            beforeId: z.string().nullable().openapi({
                                description:
                                    'ID of the list that will be before the reordered list. Null if moving to the start.'
                            }),
                            afterId: z.string().nullable().openapi({
                                description:
                                    'ID of the list that will be after the reordered list. Null if moving to the end.'
                            }),
                            boardId: z.string().openapi({ description: 'ID of the board containing the lists.' })
                        })
                    }
                }
            }
        },

        security: [
            {
                bearerAuth: []
            }
        ],
        responses: {
            200: { description: 'List reorder successfully!' }
        }
    })

    // Post /api/lists/:listId/move --> move list to another board
    listRegistry.registerPath({
        method: 'post',
        path: '/api/lists/{listId}/move',
        description: 'Move list to another board',
        summary: 'Move a list to another board',
        tags: ['Lists'],
        request: {
            params: z.object({
                listId: z.string().openapi({ description: 'ID of the list to move' })
            }),
            body: {
                description: 'Move List Payload',
                content: {
                    'application/json': {
                        schema: z.object({
                            boardId: z.string().uuid().openapi({ description: 'ID of the target board' })
                        })
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ],
        responses: {
            200: { description: 'List moved successfully!' }
        }
    })

    // Post /api/lists/:listId/duplicate --> duplicate a list
    listRegistry.registerPath({
        method: 'post',
        path: '/api/lists/{listId}/duplicate',
        description: 'Duplicate a list',
        summary: 'Duplicate an existing list',
        tags: ['Lists'],
        request: {
            params: z.object({
                listId: z.string().openapi({ description: 'ID of the list to duplicate' })
            }),
            body: {
                description: 'Duplicate List Payload',
                content: {
                    'application/json': {
                        schema: z.object({
                            boardId: z
                                .string()
                                .openapi({ description: 'ID of the board where the duplicated list will be created' }),
                            title: z.string().openapi({ description: 'Title of the duplicated list' })
                        })
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ],
        responses: {
            200: { description: 'List duplicated successfully!' }
        }
    })
}

ListRegisterPaths()
