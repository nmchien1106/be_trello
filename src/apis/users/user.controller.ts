import { NextFunction, Response, Request } from 'express'
import { errorResponse, successResponse } from '@/utils/response'
import { Status } from '@/types/response'
import UserRepository from './user.repository'
import { Role } from '@/entities/role.entity'
import AppDataSource from '@/config/typeorm.config'
import { AuthRequest } from '@/types/auth-request'
import bcrypt from 'bcrypt'

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

    createUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password, username } = req.body
            const isExistEmail = await UserRepository.findByEmailAsync(email)
            if (isExistEmail) {
                return next(errorResponse(Status.BAD_REQUEST, 'This email is already used!'))
            }

            const hashedPassword = await bcrypt.hash(password, 10)
            const newUser = UserRepository.createUser({ email, password: hashedPassword, username })

            return res.json(successResponse(Status.CREATED, 'Create new user successfully!'))
        } catch (err) {
            next(err)
        }
    }

    updateUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params
            const data = req.body
            const updatedUser = await UserRepository.updateUser(id, data)
            if (updatedUser) {
                res.json(successResponse(Status.OK, 'User updated successfully', updatedUser))
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

            await UserRepository.updateAvatar(req.user?.id as string, file.path)

            return res.json(successResponse(Status.OK, 'Avatar uploaded successfully'))
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

    updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id
            
            if (!userId) {
                 return res.status(Status.UNAUTHORIZED).json(errorResponse(Status.UNAUTHORIZED, 'Unauthorized'))
            }

            const data = { ...req.body };
            if (data.fullName) {
                data.username = data.fullName;
                delete data.fullName; 
            }
            
            const updatedUser = await UserRepository.updateUser(userId, data)
            
            if (updatedUser) {
                return res.json(successResponse(Status.OK, 'Profile updated successfully', updatedUser))
            } else {
                return res.status(Status.NOT_FOUND).json(errorResponse(Status.NOT_FOUND, 'User not found'))
            }
        } catch (err) {
            next(err)
        }
    }
}
export default new UserController()
