import { z } from 'zod'
import { Status, ApiResponseSchema } from '@/types/response'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { createApiResponse } from '@/api-docs/openApiResponseBuilder'
export const commentRegistry = new OpenAPIRegistry()

import { CommentSchema } from './comment.schema'

export const CommentRegisterPaths = () => {
    // Post /api/comments --> Create a new comment
    commentRegistry.registerPath({
        method: 'post',
        path: '/api/comments',
        tags: ['Comments'],
        summary: 'Create a new comment on a card',
        security: [{ bearerAuth: [] }],
        description: 'Creates a new comment associated with a specific card and user',
        request: {
            body: {
                description: 'Comment data',
                content: {
                    'application/json': {
                        schema: CommentSchema
                    }
                }
            }
        },
        responses: {
            ...createApiResponse(CommentSchema, 'Comment created successfully', Status.CREATED),
            ...createApiResponse(z.object(), 'Card not found', Status.NOT_FOUND),
            ...createApiResponse(z.object(), 'Unauthorized', Status.UNAUTHORIZED)
        }
    })

    // GET /api/comments/card/:cardId --> Get comments on a card
    commentRegistry.registerPath({
        method: 'get',
        path: '/api/comments/card/:cardId',
        tags: ['Comments'],
        security: [{ bearerAuth: [] }],
        summary: 'Get comments on a card',
        description: 'Retrieves all comments associated with a specific card',
        responses: {
            ...createApiResponse(z.array(CommentSchema), 'Comments retrieved successfully', Status.OK),
            ...createApiResponse(z.object(), 'Card not found', Status.NOT_FOUND),
            ...createApiResponse(z.object(), 'Unauthorized', Status.UNAUTHORIZED)
        }
    })
    // DELETE /api/comments/:commentId --> Delete a comment
    commentRegistry.registerPath({
        method: 'delete',
        path: '/api/comments/:commentId',
        tags: ['Comments'],
        summary: 'Delete a comment',
        security: [{ bearerAuth: [] }],
        description: 'Deletes a specific comment by its ID',
        responses: {
            ...createApiResponse(z.object(), 'Comment deleted successfully', Status.OK),
            ...createApiResponse(z.object(), 'Comment not found', Status.NOT_FOUND),
            ...createApiResponse(z.object(), 'Unauthorized', Status.UNAUTHORIZED)
        }
    })
    // PUT /api/comments/:commentId --> Update a comment
    commentRegistry.registerPath({
        method: 'put',
        path: '/api/comments/:commentId',
        tags: ['Comments'],
        summary: 'Update a comment',
        security: [{ bearerAuth: [] }],
        description: 'Updates the content of a specific comment by its ID',
        request: {
            body: {
                description: 'Updated comment data',
                content: {
                    'application/json': {
                        schema: CommentSchema
                    }
                }
            }
        },
        responses: {
            ...createApiResponse(CommentSchema, 'Comment updated successfully', Status.OK),
            ...createApiResponse(z.object(), 'Comment not found', Status.NOT_FOUND),
            ...createApiResponse(z.object(), 'Unauthorized', Status.UNAUTHORIZED)
        }
    })
    // GET /api/comments/:commentId --> Get comment by ID
    commentRegistry.registerPath({
        method: 'get',
        path: '/api/comments/:commentId',
        tags: ['Comments'],
        summary: 'Get comment by ID',
        security: [{ bearerAuth: [] }],
        description: 'Retrieves a specific comment by its ID',
        responses: {
            ...createApiResponse(CommentSchema, 'Comment retrieved successfully', Status.OK),
            ...createApiResponse(z.object(), 'Comment not found', Status.NOT_FOUND),
            ...createApiResponse(z.object(), 'Unauthorized', Status.UNAUTHORIZED)
        }
    })
}
