import { z } from 'zod'
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

import { CreateListSchema, UpdateListSchema } from './list.schema'
import { createApiResponse } from '@/api-docs/openApiResponseBuilder'
import { Status } from '@/types/response'

extendZodWithOpenApi(z)

export const listRegistry = new OpenAPIRegistry()

/* =======================
   CRUD LIST APIs
======================= */
export const listsRegisterPath = () => {
    // CREATE
    listRegistry.registerPath({
        method: 'post',
        path: '/api/lists',
        tags: ['Lists'],
        summary: 'Create a new list',
        security: [{ bearerAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': { schema: CreateListSchema }
                }
            }
        },
        responses: createApiResponse(z.object({ id: z.string() }), 'List created successfully', Status.CREATED)
    })

    // GET BY ID
    listRegistry.registerPath({
        method: 'get',
        path: '/api/lists/{id}',
        tags: ['Lists'],
        summary: 'Get list detail',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() })
        },
        responses: createApiResponse(z.any(), 'Get list successfully', Status.OK)
    })

    // UPDATE
    listRegistry.registerPath({
        method: 'patch',
        path: '/api/lists/{id}',
        tags: ['Lists'],
        summary: 'Update list info',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() }),
            body: {
                content: {
                    'application/json': { schema: UpdateListSchema }
                }
            }
        },
        responses: createApiResponse(z.any(), 'List updated successfully', Status.OK)
    })

    // ARCHIVE
    listRegistry.registerPath({
        method: 'patch',
        path: '/api/lists/{id}/archive',
        tags: ['Lists'],
        summary: 'Archive a list',
        security: [{ bearerAuth: [] }],
        request: { params: z.object({ id: z.string().uuid() }) },
        responses: createApiResponse(z.any(), 'List archived successfully', Status.OK)
    })

    // UNARCHIVE
    listRegistry.registerPath({
        method: 'patch',
        path: '/api/lists/{id}/unarchive',
        tags: ['Lists'],
        summary: 'Unarchive a list',
        security: [{ bearerAuth: [] }],
        request: { params: z.object({ id: z.string().uuid() }) },
        responses: createApiResponse(z.any(), 'List unarchived successfully', Status.OK)
    })

    // DELETE
    listRegistry.registerPath({
        method: 'delete',
        path: '/api/lists/{id}',
        tags: ['Lists'],
        summary: 'Delete list permanently',
        security: [{ bearerAuth: [] }],
        request: { params: z.object({ id: z.string().uuid() }) },
        responses: createApiResponse(z.any(), 'List deleted permanently', Status.OK)
    })
}

/* =======================
   ADVANCED LIST APIs
======================= */
export const ListRegisterPaths = () => {
    // REORDER
    listRegistry.registerPath({
        method: 'post',
        path: '/api/lists/{listId}/reorder',
        tags: ['Lists'],
        summary: 'Reorder a list',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ listId: z.string() }),
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            beforeId: z.string().nullable(),
                            afterId: z.string().nullable(),
                            boardId: z.string()
                        })
                    }
                }
            }
        },
        responses: { 200: { description: 'List reordered successfully' } }
    })

    // MOVE
    listRegistry.registerPath({
        method: 'post',
        path: '/api/lists/{listId}/move',
        tags: ['Lists'],
        summary: 'Move list to another board',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ listId: z.string() }),
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            boardId: z.string().uuid()
                        })
                    }
                }
            }
        },
        responses: { 200: { description: 'List moved successfully' } }
    })

    // DUPLICATE
    listRegistry.registerPath({
        method: 'post',
        path: '/api/lists/{listId}/duplicate',
        tags: ['Lists'],
        summary: 'Duplicate a list',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ listId: z.string() }),
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            boardId: z.string(),
                            title: z.string().optional()
                        })
                    }
                }
            }
        },
        responses: { 200: { description: 'List duplicated successfully' } }
    })
}
