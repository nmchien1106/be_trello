import ListRepository from './list.controller'
import express from 'express'
import { validateHandle } from '@/middleware/validate-handle'
import { ReorderListsSchema, MoveListSchema, DuplicateListSchema } from './list.schema'
import { ListRegisterPaths } from './list.swagger'
import { verifyAccessToken } from '@/utils/jwt'
import { authorizeBoardPermission } from '@/middleware/authorization'
import { Permissions } from '@/enums/permissions.enum'

const router = express.Router()

// Reorder lists
router.post(
    '/:listId/reorder',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.UPDATE_BOARD),
    validateHandle(ReorderListsSchema),
    ListRepository.reorderLists
)

// Move list to another board
router.post(
    '/:listId/move',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.UPDATE_BOARD),
    validateHandle(MoveListSchema),
    ListRepository.moveListToAnotherBoard
)

// Duplicate list
router.post(
    '/:listId/duplicate',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.UPDATE_BOARD),
    validateHandle(DuplicateListSchema),
    ListRepository.duplicateList
)

export default router
