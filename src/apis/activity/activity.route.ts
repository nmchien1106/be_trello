import { Router } from 'express'
import activityController from './activity.controller'
import { verifyAccessToken } from '@/utils/jwt'
import { validateHandle } from '@/middleware/validate-handle'
import {
    GetActivitiesByBoardSchema,
    GetActivitiesByCardSchema,
    GetActivitySchema,
    DeleteActivitySchema,
    GetActivitiesByUserSchema,
    GetActivitiesByCommentSchema
} from './activity.schema'
import { authorizeBoardPermission } from '@/middleware/authorization'
import { Permissions } from './../../enums/permissions.enum'
const route = Router()

route.get(
    '/board/:boardId',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.READ_BOARD),
    validateHandle(GetActivitiesByBoardSchema),
    activityController.getActivitiesByBoard
)

route.get(
    '/card/:cardId',
    verifyAccessToken,
    validateHandle(GetActivitiesByCardSchema),
    activityController.getActivitiesByCard
)

route.get('/user', verifyAccessToken, validateHandle(GetActivitiesByUserSchema), activityController.getActivitiesByUser)

route.get(
    '/comment/:commentId',
    verifyAccessToken,
    validateHandle(GetActivitiesByCommentSchema),
    activityController.getActivitiesByComment
)

route.get('/:id', verifyAccessToken, validateHandle(GetActivitySchema), activityController.getActivity)

route.delete('/:id', verifyAccessToken, validateHandle(DeleteActivitySchema), activityController.deleteActivity)

export default route
