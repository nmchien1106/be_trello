import { createApiResponse } from '@/api-docs/openApiResponseBuilder'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { PostCreateUser } from './user.schema'
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { UpdateUserRequest } from './user.schema'
extendZodWithOpenApi(z)

export const userRegistry = new OpenAPIRegistry()

export const usersRegisterPath = () => {
    userRegistry.registerPath({
        method: 'get',
        path: '/api/users',
        tags: ['Users'],
        summary: 'Get all users',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Get all users'
            }
        }
    })

    userRegistry.registerPath({
        method: 'get',
        path: '/api/users/{id}',
        tags: ['Users'],
        summary: 'Get user by id',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.string().openapi({ example: 'cc7a10e2-df5e-4974-8a5c-df541cdc2a17' })
            })
        },
        responses: {
            200: {
                description: 'Get user by id'
            }
        }
    })

    userRegistry.registerPath({
        method: 'post',
        path: '/api/users',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        summary: 'Register new user [only admin]',
        request: { body: PostCreateUser },
        responses: createApiResponse(z.null(), 'Success')
    })

    userRegistry.registerPath({
        method: 'patch',
        path: '/api/users/{id}',
        tags: ['Users'],
        summary: 'Update user by id',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.string().openapi({ example: 'cc7a10e2-df5e-4974-8a5c-df541cdc2a17' })
            }),
            body: {
                description: 'Update user data',
                content: {
                    'application/json': {
                        schema: UpdateUserRequest
                    }
                }
            }
        },
        responses: createApiResponse(z.null(), 'Success')
    })

    userRegistry.registerPath({
        method: 'post',
        path: '/api/users/avatar',
        tags: ['Users'],
        summary: 'Upload user avatar',
        security: [{ BearerAuth: [] }],
        security: [{ bearerAuth: [] }],
        request: {
            body: {
                description: 'Avatar file to upload',
                content: {
                    'multipart/form-data': {
                        schema: z.object({
                            avatar: z.instanceof(File).openapi({ type: 'string', format: 'binary' })
                        })
                    }
                }
            }
        },
        responses: createApiResponse(z.null(), 'Success')
    })

    userRegistry.registerPath({
        method: 'delete',
        path: '/api/users/{id}',
        tags: ['Users'],
        summary: 'Delete user by id',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.string().openapi({ example: 'cc7a10e2-df5e-4974-8a5c-df541cdc2a17' })
            })
        },
        responses: createApiResponse(z.null(), 'Success')
    })
}
