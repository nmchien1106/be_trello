import { AvatarUpload } from './../../middleware/upload'
import { usersRegisterPath } from './users.swagger'
import UserController from './user.controller'
import { Router } from 'express'
import { verifyAccessToken } from '@/utils/jwt'
import { validateHandle } from '@/middleware/validate-handle'
import { UpdateUserRequest, CreateUserSchema } from './user.schema'
import { authorizePermission } from '@/middleware/authorization'
import { Permissions } from '@/enums/permissions.enum'
const route = Router()

usersRegisterPath()

// Get all users
route
    .route('/')
    .get(verifyAccessToken, authorizePermission(Permissions.READ_USER), UserController.getAll)

// Get profile
route
    .route('/profile')
    .get(
        verifyAccessToken,
        UserController.getProfile
    )

// Upload avatar
route
    .route('/avatar')
    .post(
        verifyAccessToken,
        AvatarUpload.single('avatar'),
        UserController.uploadAvatar
    )

// Update self profile
route.route('/').patch(verifyAccessToken, validateHandle(UpdateUserRequest), UserController.updateProfile);

// Get user by id
route.route('/:id').get(verifyAccessToken, UserController.getUserByID);

// Delete profile
route.route('/').delete(verifyAccessToken, UserController.removeUser);

export default route