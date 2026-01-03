import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { CreateLabelParamSchema, CreateLabelBodySchema, CreateLabelResponseSchema, UpdateLabelBodySchema, GetLabelsOnCardResponseSchema } from './label.schema'
import { createApiResponse } from '@/api-docs/openApiResponseBuilder'
import { Status } from '@/types/response'

export const labelRegistry = new OpenAPIRegistry()

export const labelsRegisterPath = () => {
    labelRegistry.registerPath({
        method: 'post',
        path: '/api/labels/cards/{cardId}',
        tags: ['Label'],
        summary: 'Create label and attach to card',
        description: 'Create a new label in board (via card) and automatically attach it to the card',
        security: [{ bearerAuth: [] }],
        request: {
            params: CreateLabelParamSchema,
            body: {
                content: {
                    'application/json': {
                        schema: CreateLabelBodySchema
                    }
                }
            }
        },
        responses: {
            ...createApiResponse(CreateLabelResponseSchema, 'Label created and attached successfully', Status.CREATED)
        }
    })

    labelRegistry.registerPath({
        method: 'patch',
        path: '/api/labels/{id}',
        tags: ['Label'],
        summary: 'Update label on card',
        description: 'Update label name or color',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() }),
            body: {
                content: {
                    'application/json': {
                        schema: UpdateLabelBodySchema
                    }
                }
            }
        },
        responses: {
            ...createApiResponse(CreateLabelResponseSchema, 'Label updated successfully', Status.OK)
        }
    })

    labelRegistry.registerPath({
        method: 'get',
        path: '/api/labels/cards/{cardId}',
        tags: ['Label'],
        summary: 'Get all labels on card',
        description: 'Get all labels attached to a specific card',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                cardId: z.string().uuid()
            })
        },
        responses: {
            ...createApiResponse(
                GetLabelsOnCardResponseSchema,
                'Get all labels on card successfully',
                Status.OK
            )
        }
    })

    labelRegistry.registerPath({
        method: 'get',
        path: '/api/labels/{id}',
        tags: ['Label'],
        summary: 'Get label on card',
        description: 'Get label name or color',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({ id: z.string().uuid() }),
        },
        responses: {
            ...createApiResponse(CreateLabelResponseSchema, 'Get label successfully', Status.OK)
        }
    })

    labelRegistry.registerPath({
        method: 'delete',
        path: '/api/labels/{id}',
        tags: ['Label'],
        summary: 'Delete label permanently',
        description: 'Delete label permanently from board and remove all card-label relations',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.string().uuid()
            })
        },
        responses: {
            200: { description: 'Delete label successfully' },
            404: { description: 'Label not found' },
            403: { description: 'Permission denied' }
        }
    })
}
