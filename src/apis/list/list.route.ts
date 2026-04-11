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
import { checkBoardPermission, checkListPermission } from '@/middleware/authorization'
import { PERMISSIONS } from '@/enums/permissions.enum'

const router = Router()

// ===== CRUD LIST =====
router.post(
    '/',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.CREATE_LIST),
    validateHandle(CreateListSchema),
    listController.createList
)
router.get('/:listId', verifyAccessToken, checkListPermission(PERMISSIONS.READ_LIST), listController.getListById)
router.patch(
    '/:listId',
    verifyAccessToken,
    checkListPermission(PERMISSIONS.UPDATE_LIST),
    validateHandle(UpdateListSchema),
    listController.updateList
)
router.patch(
    '/:listId/archive',
    verifyAccessToken,
    checkListPermission(PERMISSIONS.UPDATE_LIST),
    listController.archiveList
)
router.patch(
    '/:listId/unarchive',
    verifyAccessToken,
    checkListPermission(PERMISSIONS.UPDATE_LIST),
    listController.unarchiveList
)
router.delete('/:listId', verifyAccessToken, checkListPermission(PERMISSIONS.DELETE_LIST), listController.deleteList)
router.get(
    '/:listId/cards',
    verifyAccessToken,
    checkListPermission(PERMISSIONS.READ_LIST),
    listController.getAllCardsInList
)

// Reorder lists
router.post(
    '/:listId/reorder',
    verifyAccessToken,
    checkListPermission(PERMISSIONS.UPDATE_LIST),
    validateHandle(ReorderListsSchema),
    listController.reorderLists
)

// Move list to another board
router.post(
    '/:listId/move',
    verifyAccessToken,
    checkListPermission(PERMISSIONS.UPDATE_LIST),
    validateHandle(MoveListSchema),
    listController.moveListToAnotherBoard
)

// Duplicate list
router.post(
    '/:listId/duplicate',
    verifyAccessToken,
    checkListPermission(PERMISSIONS.CREATE_LIST),
    validateHandle(DuplicateListSchema),
    listController.duplicateList
)

export default router
