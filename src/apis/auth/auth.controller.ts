import { WorkspaceMembers } from './../../entities/workspace-member.entity'
import redisClient from '@/config/redis.config'
import { Request, Response, NextFunction } from 'express'
import AppDataSource from '@/config/typeorm.config'
import { User } from '@/entities/user.entity'
import { Role } from '@/entities/role.entity'
import { errorResponse } from '@/utils/response'
import { Status } from '@/types/response'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { successResponse } from '@/utils/response'
import { generateToken, verifyAccessToken, verifyRefreshToken } from '@/utils/jwt'
import { AuthRequest } from '@/types/auth-request'
import { Config } from '@/config/config'
import generateNumericOTP from '@/utils/generateOTP'
import emailTransporter from '@/config/email.config'
import { generateEmailToken } from '@/utils/jwt'
import sendVerifyEmail from '@/utils/sendVerifyEmail'
import { AuthErrorCode } from '@/enums/Errors/Auth'

const useRepo = AppDataSource.getRepository(User)

class AuthController {
    private getOAuthRedirectUrl = (token: string | null) => {
        const normalizedOrigin = Config.corsOrigin.replace(/\/+$/, '')
        const hasReactBase = /\/react-app$/i.test(normalizedOrigin)
        const oauthPath = hasReactBase ? '/oauth2' : '/react-app/oauth2'
        return `${normalizedOrigin}${oauthPath}?token=${token ?? 'null'}`
    }

    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password, username } = req.body
            const isExistEmail = await useRepo.findOneBy({ email })
            if (isExistEmail) {
                return next(
                    errorResponse(Status.BAD_REQUEST, 'This email is already used!', AuthErrorCode.EMAIL_ALREADY_EXISTS)
                )
            }

            const hashedPassword = await bcrypt.hash(password, 10)
            const newUser = useRepo.create({ email, password: hashedPassword, username, isActive: false })
            if (!newUser) {
                return next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to create user'))
            }

            await useRepo.save(newUser)

            await sendVerifyEmail(newUser)

            return res.status(201).json(successResponse(Status.CREATED, 'Register successfully'))
        } catch (err) {
            return next(err)
        }
    }

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body

            const user = await useRepo.findOne({
                where: { email },
                select: { id: true, password: true, isActive: true }
            })

            if (!user) {
                return next(errorResponse(Status.BAD_REQUEST, 'Invalid email', AuthErrorCode.INVALID_CREDENTIALS))
            }

            const isPasswordValid = bcrypt.compareSync(password, user.password)
            if (!isPasswordValid) {
                return next(
                    errorResponse(
                        Status.BAD_REQUEST,
                        'Email or password is incorrect!',
                        AuthErrorCode.INVALID_CREDENTIALS
                    )
                )
            }

            if (!user.isActive) {
                return next(
                    errorResponse(
                        Status.FORBIDDEN,
                        'Please verify your email before logging in',
                        {},
                        'EMAIL_NOT_VERIFIED'
                    )
                )
            }

            const accessToken = await generateToken(user.id, 'access')
            const refreshToken = await generateToken(user.id, 'refresh')

            res.cookie('refresh', refreshToken, {
                maxAge: Config.cookieMaxAge,
                httpOnly: true,
                secure: false
            })

            res.status(200).json(
                successResponse(Status.OK, 'Login successfully!', {
                    accessToken,
                    refreshToken
                })
            )
        } catch (err) {
            console.log(err)
            return next(err)
        }
    }

    refreshToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user_id = req.user?.id
            if (!user_id) {
                return next(errorResponse(Status.UNAUTHORIZED, 'Invalid refresh token'))
            }

            const authHeader = req.headers.authorization
            if (!authHeader) {
                return next(errorResponse(Status.UNAUTHORIZED, 'Access token is required'))
            }

            const accessToken = authHeader.split(' ')[1]
            if (!accessToken) {
                return next(errorResponse(Status.UNAUTHORIZED, 'Access token is required'))
            }

            try {
                const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!)
                const redisToken = await redisClient.get(`${user_id}-access`)

                if (redisToken === accessToken) {
                    return next(errorResponse(Status.BAD_REQUEST, 'Access token is still valid'))
                }

                return next(errorResponse(Status.UNAUTHORIZED, 'Access token has been revoked'))
            } catch (err: any) {
                if (err.name !== 'TokenExpiredError') {
                    return next(errorResponse(Status.UNAUTHORIZED, 'Invalid access token'))
                }
            }

            const newAccessToken = await generateToken(user_id, 'access')

            return res.json(
                successResponse(Status.OK, 'Generate access token successfully!', { accessToken: newAccessToken })
            )
        } catch (err) {
            return next(errorResponse(Status.UNAUTHORIZED, 'Invalid refresh token'))
        }
    }

    googleOAuthCallback = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user_id = req.user?.id

            const accessToken = await generateToken(user_id as string, 'access')
            const refreshToken = await generateToken(user_id as string, 'refresh')

            res.cookie('refresh', refreshToken, {
                maxAge: Config.cookieMaxAge,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/'
            })

            res.redirect(this.getOAuthRedirectUrl(accessToken))
        } catch (err) {
            res.redirect(this.getOAuthRedirectUrl(null))
        }
    }

    forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body
            const user = await useRepo.findOneBy({ email })
            if (!user) {
                return next(errorResponse(Status.BAD_REQUEST, 'Email does not exist'))
            }

            const existingOTP = await redisClient.get(`reset-${email}`)
            if (existingOTP) {
                return next(
                    errorResponse(
                        Status.BAD_REQUEST,
                        'Already requested a reset link, your OTP will expire in a few minutes'
                    )
                )
            }
            const otp = generateNumericOTP(6)
            const resetLink = `${Config.corsOrigin}/reset-password?email=${email}&otp=${otp}`
            redisClient.setEx(`reset-${email}`, 300, otp)
            const check = await redisClient.get(`reset-${email}`)
            console.log('Generated OTP:', otp, 'Check OTP in Redis:', check)

            const mailOptions = {
                from: Config.emailUser,
                to: email,
                subject: 'Reset Password',
                text: `Your OTP link is ${resetLink}. This link is valid for 5 minutes.`
            }

            await emailTransporter.sendMail(mailOptions)

            return res.json(successResponse(Status.OK, 'Reset password link sent to your email'))
        } catch (err) {
            return next(err)
        }
    }

    resetPassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, otp, newPassword } = req.body
            const savedOTP = await redisClient.get(`reset-${email}`)
            const user = await useRepo.findOne({
                where: { email },
                select: { password: true, id: true, email: true }
            })

            if (!user) {
                return next(errorResponse(Status.BAD_REQUEST, 'Email does not exist'))
            }

            console.log(typeof savedOTP, typeof otp, 'Saved OTP:', savedOTP, 'Provided OTP:', otp)

            if (String(savedOTP) !== String(otp)) {
                return next(errorResponse(Status.BAD_REQUEST, 'Invalid or expired OTP'))
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10)
            user.password = hashedPassword
            await useRepo.save(user)
            await redisClient.del(`reset-${email}`)
            return res.json(successResponse(Status.OK, 'Password reset successfully'))
        } catch (err) {
            return next(err)
        }
    }

    sendVerifyEmail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body
            if (!email) {
                return next(errorResponse(Status.BAD_REQUEST, 'Email is required'))
            }
            const user = await useRepo.findOneBy({ email })
            if (!user) {
                return next(errorResponse(Status.BAD_REQUEST, 'User not found'))
            }
            await sendVerifyEmail(user)
            return res.json(successResponse(Status.OK, 'Verification email sent successfully'))
        } catch (err) {
            return next(err)
        }
    }

    verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, token } = req.query

            if (!email || !token) {
                return next(errorResponse(Status.BAD_REQUEST, 'Email and token are required'))
            }

            const user = await useRepo.findOneBy({ email: email as string })
            if (!user) {
                return next(errorResponse(Status.BAD_REQUEST, 'Email does not exist'))
            }
            const savedOTP = await redisClient.get(`verify-${user.id}`)

            if (!savedOTP || Number(savedOTP) !== Number(token)) {
                return next(errorResponse(Status.BAD_REQUEST, 'Invalid or expired token'))
            }

            user.isActive = true
            await useRepo.save(user)
            await redisClient.del(`verify-${user.id}`)
            return res.json(successResponse(Status.OK, 'Email verified successfully'))
        } catch (err) {
            return next(err)
        }
    }
}

export default new AuthController()
