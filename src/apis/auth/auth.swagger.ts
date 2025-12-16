import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { PostLogin, PostRegister, PostForgotPassword, PostResetPassword } from './auth.schema'
import { createApiResponse } from '@/api-docs/openApiResponseBuilder'
export const authRegistry = new OpenAPIRegistry()

import {
    RegisterSchema,
    LoginSchema,
    TokenSchema,
    refreshTokenSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    sendEmailSchema
} from './auth.schema'
import { z } from 'zod'
import { Status, ApiResponseSchema } from '@/types/response'

export const AuthRegisterPath = () => {

    // Post /api/auth/login --> Login user
    authRegistry.registerPath({
        method: 'post',
        path: '/api/auth/login',
        tags: ['Auth'],
        summary: 'User login with email and password',
        description: 'Returns access and refresh tokens if credentials are correct',
        request: { body: PostLogin },
        responses: {
            ...createApiResponse(TokenSchema, 'Login successfully!', Status.OK),
            ...createApiResponse(
                z.object({ message: z.literal('Invalid email') }),
                'Invalid email',
                Status.BAD_REQUEST
            ),
            ...createApiResponse(
                z.object({ message: z.literal('Email or password is incorrect!') }),
                'Email or password is incorrect!',
                Status.BAD_REQUEST
            ),
            ...createApiResponse(
                z.object({ message: z.literal('Please verify your email before logging in') }),
                'Please verify your email before logging in',
                Status.UNAUTHORIZED
            )
        }
    })

    authRegistry.registerPath({
        method: 'post',
        path: '/api/auth/register',
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Creates a new user account and sends a verification email',
        request: { body: PostRegister },
        responses: {
            ...createApiResponse(
                z.object({ message: z.literal('Register successfully') }),
                'Register successfully',
                Status.CREATED
            ),
            ...createApiResponse(
                z.object({ message: z.literal('This email is already used!') }),
                'This email is already used!',
                Status.BAD_REQUEST
            ),
            ...createApiResponse(
                z.object({ message: z.literal('Failed to create user') }),
                'Failed to create user',
                Status.INTERNAL_SERVER_ERROR
            )
        }
    })

    authRegistry.registerPath({
        method: 'post',
        path: '/api/auth/refresh-token',
        tags: ['Auth'],
        summary: 'Refresh access token using refresh token',
        description: 'Requires refresh token cookie. Returns a new access token.',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        responses: {
            ...createApiResponse(refreshTokenSchema, 'Generate access token successfully!', Status.OK),
            ...createApiResponse(
                z.object({ message: z.literal('Invalid refresh token') }),
                'Invalid refresh token',
                Status.UNAUTHORIZED
            ),
            ...createApiResponse(
                z.object({ message: z.literal('Access token is still valid') }),
                'Access token is still valid',
                Status.BAD_REQUEST
            )
        }
    })

    authRegistry.registerPath({
        method: 'post',
        path: '/api/auth/forgot-password',
        tags: ['Auth'],
        summary: 'Request OTP to reset password',
        description: 'Sends OTP link to user email for password reset',
        request: { body: PostForgotPassword },
        responses: {
            ...createApiResponse(
                z.object({ message: z.literal('Reset password link sent to your email') }),
                'Reset password link sent to your email',
                Status.OK
            ),
            ...createApiResponse(
                z.object({ message: z.literal('Email does not exist') }),
                'Email does not exist',
                Status.BAD_REQUEST
            ),
            ...createApiResponse(
                z.object({
                    message: z.literal('Already requested a reset link, your OTP will expire in a few minutes')
                }),
                'Already requested a reset link, your OTP will expire in a few minutes',
                Status.BAD_REQUEST
            )
        }
    })

    authRegistry.registerPath({
        method: 'post',
        path: '/api/auth/reset-password',
        tags: ['Auth'],
        summary: 'Reset user password using OTP',
        description: 'Validates OTP and updates the password',
        request: { body: PostResetPassword },
        responses: {
            ...createApiResponse(
                z.object({ message: z.literal('Password reset successfully') }),
                'Password reset successfully',
                Status.OK
            ),
            ...createApiResponse(
                z.object({ message: z.literal('Email does not exist') }),
                'Email does not exist',
                Status.BAD_REQUEST
            ),
            ...createApiResponse(
                z.object({ message: z.literal('Invalid or expired OTP') }),
                'Invalid or expired OTP',
                Status.BAD_REQUEST
            ),
            ...createApiResponse(
                z.object({ message: z.literal('Your new password cannot be the same as the old password') }),
                'Your new password cannot be the same as the old password',
                Status.BAD_REQUEST
            )
        }
    })

    authRegistry.registerPath({
        method: 'post',
        path: '/api/auth/send-verify-email',
        tags: ['Auth'],
        summary: 'Send email verification link',
        description: 'Requires Authorization header with Bearer access token',
        responses: {
            ...createApiResponse(
                z.object({ message: z.literal('Verification email sent successfully') }),
                'Verification email sent successfully',
                Status.OK
            ),
            ...createApiResponse(
                z.object({ message: z.literal('Access token is required') }),
                'Access token is required',
                Status.UNAUTHORIZED
            ),
            ...createApiResponse(
                z.object({ message: z.literal('Invalid access token') }),
                'Invalid access token',
                Status.UNAUTHORIZED
            ),
            ...createApiResponse(
                z.object({ message: z.literal('User does not exist') }),
                'User does not exist',
                Status.BAD_REQUEST
            )
        }
    })

    authRegistry.registerPath({
        method: 'get',
        path: '/api/auth/verify-email',
        tags: ['Auth'],
        summary: 'Verify user email with OTP',
        description: 'Checks OTP from query params and activates the user account',
        responses: {
            ...createApiResponse(
                z.object({ message: z.literal('Email verified successfully') }),
                'Email verified successfully',
                Status.OK
            ),
            ...createApiResponse(
                z.object({ message: z.literal('Email and OTP are required') }),
                'Email and OTP are required',
                Status.BAD_REQUEST
            ),
            ...createApiResponse(
                z.object({ message: z.literal('Email does not exist') }),
                'Email does not exist',
                Status.BAD_REQUEST
            ),
            ...createApiResponse(
                z.object({ message: z.literal('Invalid or expired OTP') }),
                'Invalid or expired OTP',
                Status.BAD_REQUEST
            )
        }
    })
    authRegistry.registerPath({
        method: 'get',
        path: '/api/auth/me',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        summary: 'Get current logged-in user info',
        description: 'Requires Authorization header with Bearer access token',
        responses: {
            ...createApiResponse(
                z.object({
                    user: z.object({
                        id: z.string(),
                        email: z.string(),
                        username: z.string(),
                        bio: z.string().nullable(),
                        avatarUrl: z.string().nullable(),
                        googleID: z.string().nullable(),
                        isActive: z.boolean(),
                        createdAt: z.string(),
                        updatedAt: z.string()
                    })
                }),
                'User fetched successfully',
                Status.OK
            ),
            ...createApiResponse(
                z.object({ message: z.literal('Invalid access token') }),
                'Invalid access token',
                Status.UNAUTHORIZED
            ),
            ...createApiResponse(z.object({ message: z.literal('User not found') }), 'User not found', Status.NOT_FOUND)
        }
    })
}
