import { ApiResponseSchema } from './../types/response'
import { z } from 'zod'

import { Status } from '@/types/response'

export function createApiResponse(schema: z.ZodTypeAny, description: string, statusCode = Status.OK) {
    return {
        [statusCode]: {
            description,
            content: {
                'application/json': {
                    schema: ApiResponseSchema(statusCode, description, schema)
                }
            }
        }
    }
}
