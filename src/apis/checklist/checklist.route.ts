import { Router } from 'express'
import checklistController from './checklist.controller'
import { verifyAccessToken } from '@/utils/jwt'
import { validateHandle } from '@/middleware/validate-handle'
import {
    CreateChecklistSchema,
    UpdateChecklistSchema,
    CreateChecklistItemSchema,
    UpdateChecklistItemSchema
} from './checklist.schema'
import { checkCardPermission, checkChecklistItemPermission, checkChecklistPermission } from '@/middleware/authorization'
import { PERMISSIONS } from '@/enums/permissions.enum'

const router = Router()

// Create a new checklist
router.post(
    '/',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.UPDATE_CARD),
    validateHandle(CreateChecklistSchema),
    checklistController.createChecklist
)

// Get all checklists on a card
router.get(
    '/card/:cardId',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.READ_CARD),
    checklistController.getChecklistsOnCard
)

// Update a checklist
router.patch(
    '/:checklistId',
    verifyAccessToken,
    checkChecklistPermission(PERMISSIONS.UPDATE_CARD),
    validateHandle(UpdateChecklistSchema),
    checklistController.updateChecklist
)

// Delete a checklist
router.delete(
    '/:checklistId',
    verifyAccessToken,
    checkChecklistPermission(PERMISSIONS.UPDATE_CARD),
    checklistController.deleteChecklist
)

// Add item to checklist
router.post(
    '/items',
    verifyAccessToken,
    checkChecklistPermission(PERMISSIONS.UPDATE_CARD),
    validateHandle(CreateChecklistItemSchema),
    checklistController.createItem
)

// Update item (check/uncheck/rename)
router.patch(
    '/items/:itemId',
    verifyAccessToken,
    checkChecklistItemPermission(PERMISSIONS.UPDATE_CARD),
    validateHandle(UpdateChecklistItemSchema),
    checklistController.updateItem
)

// Delete item from checklist
router.delete(
    '/items/:itemId',
    verifyAccessToken,
    checkChecklistItemPermission(PERMISSIONS.UPDATE_CARD),
    checklistController.deleteItem
)

export default router
