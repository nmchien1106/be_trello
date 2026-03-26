import { Router } from 'express'
import listController from './list.controller'
import { verifyAccessToken } from '@/utils/jwt'
import { validateHandle } from '@/middleware/validate-handle'
import {
    CreateListSchema,
    UpdateListSchema,
    ReorderListsSchema,
    MoveListSchema,
    DuplicateListSchema
} from './list.schema'
import { authorizeBoardPermission, authorizeListPermission } from '@/middleware/authorization'
import { Permissions } from '@/enums/permissions.enum'

const router = Router()

// ===== CRUD LIST =====
router.post(
    '/',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.CREATE_LIST),
    validateHandle(CreateListSchema),
    listController.createList
)
router.get('/:listId', verifyAccessToken, authorizeListPermission(Permissions.READ_BOARD), listController.getListById)
router.patch(
    '/:listId',
    verifyAccessToken,
    authorizeListPermission(Permissions.UPDATE_LIST),
    validateHandle(UpdateListSchema),
    listController.updateList
)
router.patch(
    '/:listId/archive',
    verifyAccessToken,
    authorizeListPermission(Permissions.UPDATE_LIST),
    listController.archiveList
)
router.patch(
    '/:listId/unarchive',
    verifyAccessToken,
    authorizeListPermission(Permissions.UPDATE_LIST),
    listController.unarchiveList
)
router.delete(
    '/:listId',
    verifyAccessToken,
    authorizeListPermission(Permissions.DELETE_LIST),
    listController.deleteList
)
router.get(
    '/:listId/cards',
    verifyAccessToken,
    authorizeListPermission(Permissions.READ_BOARD),
    listController.getAllCardsInList
)

// Reorder lists
router.post(
    '/:listId/reorder',
    verifyAccessToken,
    authorizeListPermission(Permissions.UPDATE_BOARD),
    validateHandle(ReorderListsSchema),
    listController.reorderLists
)

// Move list to another board
router.post(
    '/:listId/move',
    verifyAccessToken,
    authorizeListPermission(Permissions.UPDATE_BOARD),
    validateHandle(MoveListSchema),
    listController.moveListToAnotherBoard
)

// Duplicate list
router.post(
    '/:listId/duplicate',
    verifyAccessToken,
    authorizeListPermission(Permissions.READ_BOARD),
    validateHandle(DuplicateListSchema),
    listController.duplicateList
)

export default router
