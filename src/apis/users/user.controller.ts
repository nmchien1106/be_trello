import { NextFunction, Response, Request } from 'express'
import { errorResponse, successResponse } from '@/utils/response'
import { Status } from '@/types/response'
import UserRepository from './user.repository'
import { Role } from '@/entities/role.entity'
import AppDataSource from '@/config/typeorm.config'
import { AuthRequest } from '@/types/auth-request'
import bcrypt from 'bcrypt'
import { RoleDTOForRelation } from '../role/role.dto'

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

            const data = req.body
            if (data.password) {
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
            if (!file) {
                return res.status(Status.BAD_REQUEST).json(errorResponse(Status.BAD_REQUEST, 'No file uploaded'))
            }

            await UserRepository.updateAvatar(req.user?.id as string, file.path as string)

            return res.json(successResponse(Status.OK, 'Avatar uploaded successfully', {
                avatarUrl: file.path
            }))
        } catch (err) {
            next(err)
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