import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import {
  CreateLabelParamSchema,
  CreateLabelBodySchema,
  CreateLabelResponseSchema,
} from './label.schema'
import { createApiResponse } from '@/api-docs/openApiResponseBuilder'
import { Status } from '@/types/response'

export const labelRegistry = new OpenAPIRegistry()

export const labelsRegisterPath = () => {
  labelRegistry.registerPath({
    method: 'post',
    path: '/api/labels/cards/{cardId}',
    tags: ['Label'],
    summary: 'Create label and attach to card',
    description:
      'Create a new label in board (via card) and automatically attach it to the card',
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
      ...createApiResponse(CreateLabelResponseSchema,'Label created and attached successfully', Status.CREATED)
    }
  })
}
