import { createApiResponse } from '@/api-docs/openApiResponseBuilder'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { Status } from '@/types/response'
import {
    CreateBoardSchema,
    BoardResponseSchema,
    inviteByEmailSchema,
    joinViaShareLinkSchema,
    revokeShareLinkSchema,
    updateMemberRoleSchema,
    UpdateBoardRequest,
    BoardMemberResponseSchema
} from './board.schema'
extendZodWithOpenApi(z)

export const boardRegistry = new OpenAPIRegistry()

export const boardsRegisterPath = () => {
    // Invite user by email
    boardRegistry.registerPath({
        method: 'post',
        path: '/api/boards/{boardId}/invite/email',
        tags: ['Board'],
        summary: 'Invite user to board via email',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                boardId: z.string().uuid().openapi({ example: '322f3d3b-8cd0-4a1d-b0e2-11f3123adf44' })
            }),
            body: {
                content: {
                    'application/json': { schema: inviteByEmailSchema }
                }
            }
        },
        responses: {
            ...createApiResponse(
                z.object({ status: z.number(), message: z.string(), data: z.object({ token: z.string() }) }),
                'Invitation sent successfully'
            ),
            400: { description: 'Email is required or cannot invite yourself' },
            403: { description: 'Already a member' }
        }
    })

    // Create share link
    boardRegistry.registerPath({
        method: 'post',
        path: '/api/boards/{boardId}/invite/link',
        tags: ['Board'],
        summary: 'Create share link for board',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                boardId: z.string().uuid().openapi({ example: '322f3d3b-8cd0-4a1d-b0e2-11f3123adf44' })
            })
        },
        responses: {
            ...createApiResponse(
                z.object({ status: z.number(), message: z.string(), data: z.object({ link: z.string() }) }),
                'Share link created'
            )
        }
    })

    // Join board via token
    boardRegistry.registerPath({
        method: 'get',
        path: '/api/boards/join',
        tags: ['Board'],
        summary: 'Join board via share link or invitation',
        security: [{ bearerAuth: [] }],
        request: { query: joinViaShareLinkSchema },
        responses: {
            200: { description: 'Successfully joined the board or already a member' },
            400: { description: 'Invalid or expired token' }
        }
    })

    // Revoke share link
    boardRegistry.registerPath({
        method: 'delete',
        path: '/api/boards/revoke-link',
        tags: ['Board'],
        summary: 'Revoke share link',
        security: [{ bearerAuth: [] }],
        request: { query: revokeShareLinkSchema },
        responses: {
            200: { description: 'Share link revoked' }
        }
    })

    // Change board owner
    boardRegistry.registerPath({
        method: 'patch',
        path: '/api/boards/{boardId}/change-owner',
        tags: ['Board'],
        summary: 'Change board owner',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                boardId: z.string().uuid()
            }),
            body: {
                content: {
                    'application/json': {
                        schema: z.object({ userId: z.string().uuid() })
                    }
                }
            }
        },
        responses: {
            200: { description: 'Successfully changed board owner' },
            400: { description: 'BoardId and userId are required' },
            404: { description: 'Board not found' }
        }
    })

    // Update member role
    boardRegistry.registerPath({
        method: 'patch',
        path: '/api/boards/{boardId}/members/{userId}/role',
        tags: ['Board'],
        summary: 'Update member role in board',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                boardId: z.string().uuid(),
                userId: z.string().uuid()
            }),
            body: { content: { 'application/json': { schema: updateMemberRoleSchema } } }
        },
        responses: {
            ...createApiResponse(
                z.object({
                    status: z.literal(200),
                    message: z.string(),
                    data: z.optional(z.any())
                }),
                'Member role updated successfully'
            ),
            400: { description: 'boardId, userId and roleName are required' },
            404: { description: 'User is not a member of the board or role not found' }
        }
    })

    // Remove member
    boardRegistry.registerPath({
        method: 'delete',
        path: '/api/boards/{boardId}/members/{userId}',
        tags: ['Board'],
        summary: 'Remove member from board',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                boardId: z.string().uuid(),
                userId: z.string().uuid()
            })
        },
        responses: {
            ...createApiResponse(
                z.object({ status: z.literal(200), message: z.string(), data: z.optional(z.any()) }),
                'Member removed successfully'
            ),
            403: { description: 'Cannot remove last owner' },
            404: { description: 'User is not a member of the board' }
        }
    })

    // Update Board (Patch)
    boardRegistry.registerPath({
        method: 'patch',
        path: '/api/boards/{boardId}',
        request: {
            params: z.object({
                boardId: z.string().openapi({ example: 'bb7a10e2-df5e-4974-8a5c-df541cdc2a17' })
            }),
            body: {
                description: 'Update board data',
                content: {
                    'application/json': {
                        schema: UpdateBoardRequest
                    }
                }
            }
        },
        summary: 'Update board by id',
        security: [{ bearerAuth: [] }], // Sửa BearerAuth thành bearerAuth cho đúng chuẩn
        tags: ['Board'],
        responses: {
            200: { description: 'Board updated successfully' }
        }
    })

    // Archive board
    boardRegistry.registerPath({
        method: 'post',
        path: '/api/boards/{boardId}/archive',
        summary: 'Archive board by id',
        security: [{ bearerAuth: [] }],
        tags: ['Board'],
        request: {
            params: z.object({
                boardId: z.string().openapi({ example: 'bb7a10e2-df5e-4974-8a5c-df541cdc2a17' })
            })
        },
        responses: {
            200: { description: 'Board archived successfully' },
            500: { description: 'Failed to archive board' }
        }
    })

    // Reopen board
    boardRegistry.registerPath({
        method: 'post',
        path: '/api/boards/{boardId}/reopen',
        summary: 'Reopen board by id',
        security: [{ bearerAuth: [] }],
        tags: ['Board'],
        request: {
            params: z.object({
                boardId: z.string().openapi({ example: 'bb7a10e2-df5e-4974-8a5c-df541cdc2a17' })
            })
        },
        responses: {
            200: { description: 'Board reopened successfully' },
            500: { description: 'Failed to reopen board' }
        }
    })

    // Upload board background
    boardRegistry.registerPath({
        method: 'post',
        path: '/api/boards/{boardId}/background',
        summary: 'Upload board background',
        security: [{ bearerAuth: [] }],
        tags: ['Board'],
        request: {
            params: z.object({
                boardId: z.string().openapi({ example: 'bb7a10e2-df5e-4974-8a5c-df541cdc2a17' })
            }),
            body: {
                description: 'Board background image file',
                content: {
                    'multipart/form-data': {
                        schema: z.object({
                            background: z.instanceof(File).openapi({ type: 'string', format: 'binary' })
                        })
                    }
                }
            }
        },
        responses: {
            200: { description: 'Background uploaded successfully' },
            500: { description: 'Failed to upload background' }
        }
    })

    // Delete board permanently
    boardRegistry.registerPath({
        method: 'delete',
        path: '/api/boards/{boardId}',
        summary: 'Delete board permanently by id',
        security: [{ bearerAuth: [] }],
        tags: ['Board'],
        request: {
            params: z.object({
                boardId: z.string().openapi({ example: 'bb7a10e2-df5e-4974-8a5c-df541cdc2a17' })
            })
        },
        responses: {
            200: { description: 'Board deleted permanently' },
            500: { description: 'Failed to delete board' }
        }
    })

    // Get Public Boards
    boardRegistry.registerPath({
        method: 'get',
        path: '/api/boards/public',
        tags: ['Board'],
        summary: 'Get public boards',
        responses: {
            ...createApiResponse(z.array(BoardResponseSchema), 'Success', Status.OK)
        }
    })

    // Get All Boards
    boardRegistry.registerPath({
        method: 'get',
        path: '/api/boards',
        tags: ['Board'],
        summary: 'Get all accessible boards',
        security: [{ bearerAuth: [] }],
        responses: {
            ...createApiResponse(z.array(BoardResponseSchema), 'Success', Status.OK)
        }
    })

    // Get Board By ID
    boardRegistry.registerPath({
        method: 'get',
        path: '/api/boards/{id}',
        tags: ['Board'],
        summary: 'Get board detail',
        security: [{ bearerAuth: [] }],
        request: { params: z.object({ id: z.string().uuid() }) },
        responses: {
            ...createApiResponse(BoardResponseSchema, 'Success', Status.OK),
            403: { description: 'Permission denied' },
            404: { description: 'Not found' }
        }
    })

    // Create Board
    boardRegistry.registerPath({
        method: 'post',
        path: '/api/boards',
        tags: ['Board'],
        summary: 'Create new board',
        security: [{ bearerAuth: [] }],
        request: {
            body: {
                content: { 'application/json': { schema: CreateBoardSchema } }
            }
        },
        responses: {
            ...createApiResponse(BoardResponseSchema, 'Created', Status.CREATED)
        }
    })

    //Get member
    boardRegistry.registerPath({
        method: 'get',
        path: '/api/boards/{id}/members',
        tags: ['Board'],
        summary: 'Get all members of a board',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.string().uuid()
            })
        },
        responses: {
            ...createApiResponse(BoardMemberResponseSchema, 'Get board members successfully', Status.OK),
            403: { description: 'Permission denied' },
            404: { description: 'Board not found' }
        }
    })

    //Get All Template
    boardRegistry.registerPath({
        method: 'get',
        path: '/api/boards/template',
        tags: ['Board'],
        summary: 'Get all templates',
        security: [{ bearerAuth: [] }],
        request: {},
        responses: {
            200: {
                description: 'Templates fetched successfully'
            }
        }
    });

    //Get Template By Id
    boardRegistry.registerPath({
        method: 'get',
        path: '/api/boards/template/{id}',
        tags: ['Board'],
        summary: 'Get template by id',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.string().uuid().describe("Template ID")
            })
        },
        responses: {
            200: {
                description: 'Template fetched successfully'
            },
            404: {
                description: 'Template not found'
            }
        }
    });

}
