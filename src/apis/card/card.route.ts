import { Router } from 'express'
import cardController from './card.controller'
import { verifyAccessToken } from '@/utils/jwt'
import { validateHandle } from '@/middleware/validate-handle'
import { AddMemberToCard, CreateCardSchema } from './card.schema'
import { authorizeCardPermission } from '@/middleware/authorization'
import { Permissions } from '@/enums/permissions.enum'

const route = Router()
// Create a new card
route.post(
    '/',
    verifyAccessToken,
    authorizeCardPermission(Permissions.CREATE_CARD),
    validateHandle(CreateCardSchema),
    cardController.createCard
)

// Get card by id
route.get('/:id', verifyAccessToken, authorizeCardPermission(Permissions.READ_CARD), cardController.getCardById)

// Update a card
route.patch(
    '/:id',
    verifyAccessToken,
    authorizeCardPermission(Permissions.UPDATE_CARD),
    validateHandle(CreateCardSchema),
    cardController.updateCard
)

// Delete a card
route.delete('/:id', verifyAccessToken, authorizeCardPermission(Permissions.DELETE_CARD), cardController.deleteCard)

// Add member to card
route.post(
    '/:id/members',
    verifyAccessToken,
    authorizeCardPermission(Permissions.ADD_MEMBER_TO_CARD),
    validateHandle(AddMemberToCard),
    cardController.addMemberToCard
)
export default route
