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

route
    .route('/')
    .get(verifyAccessToken, authorizePermission(Permissions.READ_USER), UserController.getAll)
    .post(
        verifyAccessToken,
        authorizePermission(Permissions.CREATE_USER),
        validateHandle(CreateUserSchema),
        UserController.createUser
    )

route
    .route('/profile')
    .get(
        verifyAccessToken,
        // authorizePermission(Permissions.READ_USER),
        UserController.getProfile
    )
    .put(
        verifyAccessToken,
        validateHandle(UpdateUserRequest),
        UserController.updateProfile
    )
route
    .route('/avatar')
    .post(
        verifyAccessToken,
        authorizePermission(Permissions.UPDATE_USER),
        AvatarUpload.single('avatar'),
        UserController.uploadAvatar
    )

route
    .route('/:id')
    .get(verifyAccessToken, authorizePermission(Permissions.READ_USER), UserController.getUserByID)
    .patch(
        verifyAccessToken,
        authorizePermission(Permissions.UPDATE_USER),
        validateHandle(UpdateUserRequest),
        UserController.updateUser
    )
    .delete(verifyAccessToken, authorizePermission(Permissions.DELETE_USER), UserController.removeUser)

export default route