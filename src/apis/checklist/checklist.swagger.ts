import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { CreateChecklistSchema, UpdateChecklistSchema, CreateChecklistItemSchema, UpdateChecklistItemSchema } from './checklist.schema'
import { createApiResponse } from '@/api-docs/openApiResponseBuilder'
import { Status } from '@/types/response'

extendZodWithOpenApi(z)

export const checklistRegistry = new OpenAPIRegistry()

export const checklistRegisterPath = () => {
    // Create a new checklist
    checklistRegistry.registerPath({
        method: 'post',
        path: '/api/checklists',
        tags: ['Checklist'],
        summary: 'Create a new checklist',
        security: [{ bearerAuth: [] }],
        request: {
            body: { content: { 'application/json': { schema: CreateChecklistSchema } } }
        },
        responses: { ...createApiResponse(z.object({ id: z.string() }), 'Created', Status.CREATED) }
    })

    // Update a checklist
    checklistRegistry.registerPath({
        method: 'get',
        path: '/api/checklists/card/{cardId}',
        tags: ['Checklist'],
        summary: 'Get all checklists on a card',
        security: [{ bearerAuth: [] }],
        request: { params: z.object({ cardId: z.string().uuid() }) },
        responses: { ...createApiResponse(z.array(z.any()), 'Success', Status.OK) }
    })

    // Update a checklist
    checklistRegistry.registerPath({
        method: 'post',
        path: '/api/checklists/items',
        tags: ['Checklist'],
        summary: 'Add item to checklist',
        security: [{ bearerAuth: [] }],
        request: {
            body: { content: { 'application/json': { schema: CreateChecklistItemSchema } } }
        },
        responses: { ...createApiResponse(z.object({ id: z.string() }), 'Created', Status.CREATED) }
    })

    // Delete a checklist
    checklistRegistry.registerPath({
        method: 'delete',
        path: '/api/checklists/{id}',
        tags: ['Checklist'],
        summary: 'Delete a checklist',
        security: [{ bearerAuth: [] }],
        request: { params: z.object({ id: z.string().uuid() }) },
        responses: { ...createApiResponse(z.any(), 'Deleted', Status.OK) }
    })

    // Update item (check/uncheck/rename)
    checklistRegistry.registerPath({
        method: 'patch',
        path: '/api/checklists/items/{id}',
        tags: ['Checklist'],
        summary: 'Update item (check/uncheck/rename)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() }),
            body: { content: { 'application/json': { schema: UpdateChecklistItemSchema } } }
        },
        responses: { ...createApiResponse(z.any(), 'Updated', Status.OK) }
    })

    // Delete item from checklist
    checklistRegistry.registerPath({
        method: 'delete',
        path: '/api/checklists/items/{id}',
        tags: ['Checklist'],
        summary: 'Delete item from checklist',
        security: [{ bearerAuth: [] }],
        request: { params: z.object({ id: z.string().uuid() }) },
        responses: { ...createApiResponse(z.any(), 'Deleted', Status.OK) }
    })
}