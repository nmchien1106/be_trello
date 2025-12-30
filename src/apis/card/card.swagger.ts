import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import {
    CreateCardSchema,  AttachmentSchema, CreateAttachmentSchema,
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

    cardRegistry.registerPath({
        method: 'post',
        path: '/api/cards/{id}/background',
        tags: ['Card'],
        summary: 'Upload background for card',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() }),
            body: {
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                file: { type: 'string', format: 'binary' }
                            },
                            required: ['file']
                        }
                    }
                }
            }
        },
        responses: createApiResponse(
            z.object({
                id: z.string().uuid(),
                backgroundPath: z.string(),
                backgroundPublicId: z.string()
            }),
            'Card background uploaded successfully',
            Status.OK
        )
    });

    cardRegistry.registerPath({
        method: 'post',
        path: '/api/cards/{id}/presigned-url',
        tags: ['Card'],
        summary: 'Generate presigned URL for attachment upload',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() }),
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            fileName: z.string(),
                            fileType: z.string(),
                            fileSize: z.number()
                        })
                    }
                }
            }
        },
        responses: createApiResponse(
            z.object({ uploadUrl: z.string(), publicId: z.string(), uploadPreset: z.string() }),
            'Presigned URL generated successfully',
            Status.OK
        )
    })

    cardRegistry.registerPath({
        method: 'post',
        path: '/api/cards/{id}/attachments',
        tags: ['Card'],
        summary: 'Create attachment from URL',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() }),
            body: {
                content: {
                    'application/json': { schema: CreateAttachmentBodySchema }
                }
            }
        },
        responses: createApiResponse(AttachmentSchema, 'Attachment uploaded successfully', Status.OK)
    });



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
            ...createApiResponse(AttachmentSchema, 'Attachment uploaded successfully', Status.OK)
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

    cardRegistry.registerPath({
        method: 'get',
        path: '/api/cards/{id}/attachments',
        tags: ['Card'],
        summary: 'Get attachments on card',
        security: [{ bearerAuth: []}],
        request: {
            params: z.object({ id: z.string().uuid()})
        },
        responses: createApiResponse(z.array(AttachmentSchema), 'Get attachments successfully', Status.OK)
    })

    cardRegistry.registerPath({
        method: 'delete',
        path: '/api/cards/attachments/{id}',
        tags: ['Card'],
        summary: 'Delete an attachment',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid('Invalid attachment ID') })
        },
        responses: {
            200: { description: 'Attachment deleted successfully'},
            404: { description: 'Attachment not found' },
        }
    });

}
