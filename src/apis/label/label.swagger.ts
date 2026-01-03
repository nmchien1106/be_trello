import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { CreateLabelParamSchema, CreateLabelBodySchema, CreateLabelResponseSchema, UpdateLabelBodySchema } from './label.schema'
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
}
