import { NextFunction, Response, Request } from 'express'
import { errorResponse, successResponse } from '@/utils/response'
import { Status } from '@/types/response'
import UserRepository from './user.repository'
import { Role } from '@/entities/role.entity'
import AppDataSource from '@/config/typeorm.config'
import { AuthRequest } from '@/types/auth-request'
import bcrypt from 'bcrypt'
import { RoleDTOForRelation } from '../role/role.dto'
import cloudinary from '@/config/cloundinary'

const roleRepo = AppDataSource.getRepository(Role)

class UserController {
    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const users = await UserRepository.findAll()
            return res.json(successResponse(Status.OK, 'Users fetched successfully', users))
        } catch (err) {
            next(err)
        }
    }

    getUserByID = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params
            const user = await UserRepository.findById(id)
            if (user) {
                res.json(successResponse(Status.OK, 'User fetched successfully', user))
            } else {
                res.status(Status.NOT_FOUND).json(errorResponse(Status.NOT_FOUND, 'User not found'))
            }
        } catch (err) {
            next(err)
        }
    }

    updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id
            if (!userId) return next(errorResponse(Status.UNAUTHORIZED, 'Unauthorized'))

            const data = req.body
            if (data.password) {
                const userWithPassword = await UserRepository.findByIdWithPassword(userId)
                if (userWithPassword?.password) {
                    const isSame = await bcrypt.compare(data.password, userWithPassword.password)
                    if (isSame) {
                        return res.status(Status.BAD_REQUEST).json(
                            errorResponse(Status.BAD_REQUEST, 'New password must be different from the current password')
                        )
                    }
                }
                data.password = await bcrypt.hash(data.password, 10)
            }
            const updatedUser = await UserRepository.updateUser(userId, data)

            if (updatedUser) {
                res.json(successResponse(Status.OK, 'Profile updated successfully'))
            } else {
                res.status(Status.NOT_FOUND).json(errorResponse(Status.NOT_FOUND, 'User not found'))
            }
        } catch (err) {
            next(err)
        }
    }

    uploadAvatar = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const file = req.file
            const userId = req.user?.id

            if (!file || !(file as Express.Multer.File).buffer) {
                return res.status(Status.BAD_REQUEST).json(errorResponse(Status.BAD_REQUEST, 'No file uploaded or invalid payload'))
            }
            if (!userId) {
                return res.status(Status.UNAUTHORIZED).json(errorResponse(Status.UNAUTHORIZED, 'Unauthorized'))
            }

            const publicId = `user_${userId}_avatar`

            const uploadResult = await new Promise<any>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject({ status: Status.GATEWAY_TIMEOUT, message: 'Avatar upload timed out. Please try again.' })
                }, 30000)

                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'avatars',
                        public_id: publicId,
                        resource_type: 'image',
                        transformation: [{ width: 500, height: 500, crop: 'limit' }]
                    },
                    (error, result) => {
                        clearTimeout(timeout)
                        if (error) {
                            return reject(error)
                        }
                        resolve(result)
                    }
                )

                stream.end((file as Express.Multer.File).buffer)
            })

            const avatarUrl = uploadResult.secure_url || uploadResult.url
            await UserRepository.updateAvatar(userId, avatarUrl)

            return res.json(successResponse(Status.OK, 'Avatar uploaded successfully', {
                avatarUrl: avatarUrl
            }))
        } catch (err: any) {
            if (err.status) {
                next(errorResponse(err.status, err.message))
            } else {
                next(err)
            }
        }
    }
    getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id
            if (!userId) {
                return res.status(Status.UNAUTHORIZED).json(errorResponse(Status.UNAUTHORIZED, 'Unauthorized'))
            }

            const user = await UserRepository.findById(userId)

            if (user) {
                return res.json(successResponse(Status.OK, 'Get profile successfully', user))
            } else {
                return res.status(Status.NOT_FOUND).json(errorResponse(Status.NOT_FOUND, 'User not found'))
            }
        } catch (err) {
            next(err)
        }
    }

    removeUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params
            await UserRepository.deleteUser(id)
            return res.json(successResponse(Status.OK, 'User deleted successfully'))
        } catch (err) {
            next(err)
        }
    }

}
export default new UserController()