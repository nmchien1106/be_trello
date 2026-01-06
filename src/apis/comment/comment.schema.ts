import { z } from 'zod'
import { ZodRequestBody, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
extendZodWithOpenApi(z)

export const CommentSchema = z.object({
    content: z.string().min(1, 'Content cannot be empty').openapi({ example: 'This is a comment.' }),
    cardId: z.string().uuid().openapi({ example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' }),
})
