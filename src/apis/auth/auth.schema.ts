import { z } from 'zod'
import { ZodRequestBody, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const PasswordSchema = z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
        /(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character'
    )

export const LoginSchema = z.object({
    email: z.string().email('Invalid email address').openapi({ example: 'admin@gmail.com' }),
    password: PasswordSchema
})

export const RegisterSchema = z.object({
    username: z.string(),
    email: z.string().email('Invalid email address'),
    password: PasswordSchema
})

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address')
})


export const resetPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: PasswordSchema
})



export const TokenSchema = z.object({
    refreshToken: z.string(),
    accessToken: z.string()
})
export const refreshTokenSchema = z.object({
    accessToken: z.string()
})
export const sendEmailSchema = z.object({
    email: z.string().email('Invalid email address')
})

export const verifyEmailSchema = z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits')
})

export const PostLogin: ZodRequestBody = {
    description: 'Login to continue',
    content: {
        'application/json': {
            schema: LoginSchema
        }
    }
}

export const PostRegister: ZodRequestBody = {
    description: 'Create new user',
    content: {
        'application/json': {
            schema: RegisterSchema
        }
    }
}

export const PostForgotPassword: ZodRequestBody = {
    description: 'Request to reset password',
    content: {
        'application/json': {
            schema: forgotPasswordSchema
        }
    }
}

export const PostResetPassword: ZodRequestBody = {
    description: 'Reset password using OTP',
    content: {
        'application/json': {
            schema: resetPasswordSchema
        }
    }
}
