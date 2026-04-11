import { Router } from 'express'
import cardController from './card.controller'
import { verifyAccessToken } from '@/utils/jwt'
import { validateHandle } from '@/middleware/validate-handle'
import {
    CreateCardSchema,
    CreateAttachmentSchema,
    ReorderCardSchema,
    DuplicateCardSchema,
    MoveCardToBoardSchema,
    AddMemberToCard,
    UpdateCardSchema,
    GetAssignedCardsSchema
} from './card.schema'
import { PERMISSIONS } from '@/enums/permissions.enum'
import {
    checkAttachmentPermission,
    checkBoardPermission,
    checkCardPermission,
    checkListPermission
} from '@/middleware/authorization'
import { CardBackgroundUpload } from '@/middleware/upload'

const route = Router()
route.get('/due-soon', verifyAccessToken, cardController.getCardsDueSoon) // SCRUM-164
route.get('/assigned', verifyAccessToken, validateHandle(GetAssignedCardsSchema), cardController.getAssignedCards) // SCRUM-163
route.get('/search', verifyAccessToken, cardController.globalSearch) // SCRUM-165
route.get(
    '/board/:boardId',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.READ_BOARD),
    cardController.getCardsInBoard
) // SCRUM-162

// Create a new card
route.post(
    '/',
    verifyAccessToken,
    checkListPermission(PERMISSIONS.CREATE_CARD),
    validateHandle(CreateCardSchema),
    cardController.createCard
)

// Get card by id
route.get('/:cardId', verifyAccessToken, checkCardPermission(PERMISSIONS.READ_CARD), cardController.getCardById)

// Update a card
route.patch(
    '/:cardId',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.UPDATE_CARD),
    validateHandle(UpdateCardSchema),
    cardController.updateCard
)

// Delete a card
route.delete('/:cardId', verifyAccessToken, checkCardPermission(PERMISSIONS.DELETE_CARD), cardController.deleteCard)

// Add member to card
route.post(
    '/:cardId/members',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.ADD_MEMBER_TO_CARD),
    validateHandle(AddMemberToCard),
    cardController.addMemberToCard
)

// Get members of a card
route.get(
    '/:cardId/members',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.READ_CARD),
    cardController.getMembersOfCard
)

// Remove member from card
route.delete(
    '/:cardId/members',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.REMOVE_MEMBER_FROM_CARD),
    cardController.removeMemberOfCard
)

route.post(
    '/:cardId/reorder',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.UPDATE_CARD),
    validateHandle(ReorderCardSchema),
    cardController.reorderCard
)

route.post(
    '/:cardId/reorder-list',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.UPDATE_CARD),
    validateHandle(ReorderCardSchema),
    cardController.reorderCardList
)

route.post(
    '/:cardId/move',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.UPDATE_CARD),
    validateHandle(MoveCardToBoardSchema),
    cardController.moveCardToBoard
)

route.post(
    '/:cardId/duplicate',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.UPDATE_CARD),
    validateHandle(DuplicateCardSchema),
    cardController.duplicateCard
)

route.patch(
    '/:cardId/archive',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.UPDATE_CARD),
    cardController.archiveCard
)
route.patch(
    '/:cardId/unarchive',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.UPDATE_CARD),
    cardController.unarchiveCard
)

route.post(
    '/:cardId/presigned-url',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.UPDATE_CARD),
    cardController.getPresignedUrl
)

//Create attachment on card
route.post(
    '/:cardId/attachments',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.UPDATE_CARD),
    validateHandle(CreateAttachmentSchema),
    cardController.createAttachment
)

//Get attachments on card
route.get(
    '/:cardId/attachments',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.READ_CARD),
    cardController.getAttachmentsByCard
)

//Delete attachment on card
route.delete(
    '/attachments/:id',
    verifyAccessToken,
    checkAttachmentPermission(PERMISSIONS.UPDATE_CARD),
    cardController.deleteAttachment
)

route.post(
    '/:cardId/background',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.UPDATE_CARD),
    CardBackgroundUpload.single('file'),
    cardController.uploadCardBackground
)

// Get unassigned members of a card
route.get(
    '/:cardId/unassigned-members',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.READ_CARD),
    cardController.getUnassignedMembers
)

export default route
