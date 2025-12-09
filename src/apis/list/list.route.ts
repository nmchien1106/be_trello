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
import { authorizeBoardPermission } from '@/middleware/authorization'
import { Permissions } from '@/enums/permissions.enum'

const router = Router()

// ===== CRUD LIST =====
router.post('/', verifyAccessToken, validateHandle(CreateListSchema), listController.createList)
router.get('/:id', verifyAccessToken, listController.getListById)
router.patch('/:id', verifyAccessToken, validateHandle(UpdateListSchema), listController.updateList)
router.patch('/:id/archive', verifyAccessToken, listController.archiveList)
router.patch('/:id/unarchive', verifyAccessToken, listController.unarchiveList)
router.delete('/:id', verifyAccessToken, listController.deleteList)

// ===== ADVANCED (giữ từ dev) =====

// Reorder lists
router.post(
    '/:listId/reorder',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.UPDATE_BOARD),
    validateHandle(ReorderListsSchema),
    listController.reorderLists
)

// Move list to another board
router.post(
    '/:listId/move',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.UPDATE_BOARD),
    validateHandle(MoveListSchema),
    listController.moveListToAnotherBoard
)

// Duplicate list
router.post(
    '/:listId/duplicate',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.UPDATE_BOARD),
    validateHandle(DuplicateListSchema),
    listController.duplicateList
)

export default router
