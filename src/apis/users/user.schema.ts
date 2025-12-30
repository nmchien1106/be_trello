import { z } from 'zod'
import { ZodRequestBody, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

// update user schema not id and google id
export const UpdateUserRequest = z
    .object({
        username: z.string().min(3).max(30).optional(),
        email: z.string().email('Invalid email address').optional(),
        password: z.string().min(6).max(100).optional(),
        avatarUrl: z.string().url().nullable().optional()
    })
    .strict()

export const CreateUserSchema = z.object({
    username: z.string(),
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters long')
        .regex(
            /(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character'
        )
})

export const PostCreateUser: ZodRequestBody = {
    description: 'Create new user',
    content: {
        'application/json': {
            schema: CreateUserSchema
        }
    }
}
