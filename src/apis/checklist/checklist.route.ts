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

const router = Router()

router.post('/', verifyAccessToken, validateHandle(CreateChecklistSchema), checklistController.createChecklist)

router.get('/card/:cardId', verifyAccessToken, checklistController.getChecklistsOnCard)

router.patch('/:id', verifyAccessToken, validateHandle(UpdateChecklistSchema), checklistController.updateChecklist)

router.delete('/:id', verifyAccessToken, checklistController.deleteChecklist)

router.post('/items', verifyAccessToken, validateHandle(CreateChecklistItemSchema), checklistController.createItem)

router.patch('/items/:id', verifyAccessToken, validateHandle(UpdateChecklistItemSchema), checklistController.updateItem)

router.delete('/items/:id', verifyAccessToken, checklistController.deleteItem)

export default router