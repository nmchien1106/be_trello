import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { CreateListSchema, UpdateListSchema } from './list.schema'
import { createApiResponse } from '@/api-docs/openApiResponseBuilder'
import { Status } from '@/types/response'

extendZodWithOpenApi(z)

export const listRegistry = new OpenAPIRegistry()

export const listsRegisterPath = () => {
    // POST: Create List
    listRegistry.registerPath({
        method: 'post',
        path: '/api/lists',
        tags: ['List'],
        summary: 'Create a new list',
        security: [{ bearerAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': { schema: CreateListSchema }
                }
            }
        },
        responses: {
            ...createApiResponse(z.object({ id: z.string() }), 'List created successfully', Status.CREATED)
        }
    })

    // GET: Get List By ID
    listRegistry.registerPath({
        method: 'get',
        path: '/api/lists/{id}',
        tags: ['List'],
        summary: 'Get list detail',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() })
        },
        responses: {
            ...createApiResponse(z.any(), 'Get list successfully', Status.OK)
        }
    })

    // PATCH: Update List (Rename)
    listRegistry.registerPath({
        method: 'patch',
        path: '/api/lists/{id}',
        tags: ['List'],
        summary: 'Update list info (Rename)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() }),
            body: {
                content: {
                    'application/json': { schema: UpdateListSchema }
                }
            }
        },
        responses: {
            ...createApiResponse(z.any(), 'List updated successfully', Status.OK)
        }
    })

    // PATCH: Archive List
    listRegistry.registerPath({
        method: 'patch',
        path: '/api/lists/{id}/archive',
        tags: ['List'],
        summary: 'Archive a list',
        security: [{ bearerAuth: [] }],
        request: { params: z.object({ id: z.string().uuid() }) },
        responses: { ...createApiResponse(z.any(), 'List archived successfully', Status.OK) }
    })

    // PATCH: Unarchive List
    listRegistry.registerPath({
        method: 'patch',
        path: '/api/lists/{id}/unarchive',
        tags: ['List'],
        summary: 'Unarchive a list',
        security: [{ bearerAuth: [] }],
        request: { params: z.object({ id: z.string().uuid() }) },
        responses: { ...createApiResponse(z.any(), 'List unarchived successfully', Status.OK) }
    })

    // DELETE: Delete List
    listRegistry.registerPath({
        method: 'delete',
        path: '/api/lists/{id}',
        tags: ['List'],
        summary: 'Delete list permanently',
        security: [{ bearerAuth: [] }],
        request: { params: z.object({ id: z.string().uuid() }) },
        responses: { ...createApiResponse(z.any(), 'List deleted permanently', Status.OK) }
    })
}