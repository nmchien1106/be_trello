import { createApiResponse } from '@/api-docs/openApiResponseBuilder'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
extendZodWithOpenApi(z)

export const roleRegistry = new OpenAPIRegistry()

export const roleRegisterPath = () => {

    // GET ALL ROLE API
    roleRegistry.registerPath({
        method: 'get',
        path: '/api/roles',
        tags: ['Roles'],
        summary: 'Get all roles',
        security: [{ BearerAuth: [] }],
        responses: {
            200: {
                description: 'Get all roles'
            }
        }
    })

    // GET ROLE BY ID API
    roleRegistry.registerPath({
        method: 'get',
        path: '/api/roles/id/{id}',
        tags: ['Roles'],
        summary: 'Get role by ID',
        security: [{ BearerAuth: [] }],
        request : {
            params: z.object({
                id: z.string().openapi({ description: 'Role ID' })
            })
        },
        responses: {
            200: {
                description: 'Get role by ID'
            }
        }
    })

    // GET ROLE BY NAME API
    roleRegistry.registerPath({
        method: 'get',
        path: '/api/roles/name/{name}',
        tags: ['Roles'],
        summary: 'Get role by name',
        security: [{ BearerAuth: [] }],
        request : {
            params: z.object({
                name: z.string().openapi({ description: 'Role name' })
            })
        },
        responses: {
            200: {
                description: 'Get role by name'
            }
        }
    })
}