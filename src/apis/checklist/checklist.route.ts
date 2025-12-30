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
import { authorizeCardPermission } from '@/middleware/authorization'
import { Permissions } from '@/enums/permissions.enum'

const router = Router()

// Create a new checklist
router.post(
    '/',
    verifyAccessToken,
    authorizeCardPermission(Permissions.UPDATE_CARD),
    validateHandle(CreateChecklistSchema),
    checklistController.createChecklist
)

// Get all checklists on a card
router.get('/card/:cardId', verifyAccessToken, checklistController.getChecklistsOnCard)

// Update a checklist
router.patch('/:id', verifyAccessToken, validateHandle(UpdateChecklistSchema), checklistController.updateChecklist)

// Delete a checklist
router.delete('/:id', verifyAccessToken, checklistController.deleteChecklist)

// Add item to checklist
router.post('/items', verifyAccessToken, validateHandle(CreateChecklistItemSchema), checklistController.createItem)

// Update item (check/uncheck/rename)
router.patch(
    '/items/:itemId',
    verifyAccessToken,
    validateHandle(UpdateChecklistItemSchema),
    checklistController.updateItem
)

// Delete item from checklist
router.delete('/items/:itemId', verifyAccessToken, checklistController.deleteItem)


export default router
