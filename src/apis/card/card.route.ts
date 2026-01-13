import { Router } from 'express'
import cardController from './card.controller'
import { verifyAccessToken } from '@/utils/jwt'
import { validateHandle } from '@/middleware/validate-handle'
import {
    CreateCardSchema, CreateAttachmentSchema,
    ReorderCardSchema,
    DuplicateCardSchema,
    MoveCardToBoardSchema,
    AddMemberToCard
} from './card.schema'
import { Permissions } from './../../enums/permissions.enum';
import { authorizeCardPermission, authorizeAttachmentPermission } from '@/middleware/authorization';
import multer from 'multer'
import { AttachmentUpload, CardBackgroundUpload } from '@/middleware/upload';


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

// Get members of a card
route.get(
    '/:id/members',
    verifyAccessToken,
    authorizeCardPermission(Permissions.READ_CARD),
    cardController.getMembersOfCard
)

// Remove member from card
route.delete(
    '/:id/members',
    verifyAccessToken,
    authorizeCardPermission(Permissions.REMOVE_MEMBER_FROM_CARD),
    cardController.removeMemberOfCard
)

route.post(
    '/:id/reorder',
    verifyAccessToken,
    authorizeCardPermission(Permissions.UPDATE_BOARD),
    validateHandle(ReorderCardSchema),
    cardController.reorderCard
)

route.post(
    '/:id/move',
    verifyAccessToken,
    authorizeCardPermission(Permissions.UPDATE_CARD),
    validateHandle(MoveCardToBoardSchema),
    cardController.moveCardToBoard
)

route.post(
    '/:id/duplicate',
    verifyAccessToken,
    authorizeCardPermission(Permissions.READ_BOARD),
    validateHandle(DuplicateCardSchema),
    cardController.duplicateCard
)

route.patch(
    '/:id/archive',
    verifyAccessToken,
    authorizeCardPermission(Permissions.UPDATE_CARD),
    cardController.archiveCard
)
route.patch(
    '/:id/unarchive',
    verifyAccessToken,
    authorizeCardPermission(Permissions.UPDATE_CARD),
    cardController.unarchiveCard
)


route.post('/:id/presigned-url',
    verifyAccessToken,
    authorizeCardPermission(Permissions.UPDATE_CARD),
    cardController.getPresignedUrl)


route.post('/:id/presigned-url',
    verifyAccessToken,
    authorizeCardPermission(Permissions.UPDATE_CARD),
    cardController.getPresignedUrl)

//Create attachment on card
route.post('/:id/attachments',
    verifyAccessToken,
    authorizeCardPermission(Permissions.UPDATE_CARD),
    validateHandle(CreateAttachmentSchema),
    cardController.createAttachment);


//Get attachments on card
route.get('/:id/attachments',
    verifyAccessToken,
    authorizeCardPermission(Permissions.READ_CARD),
    cardController.getAttachmentsByCard
)

//Delete attachment on card
route.delete(
    '/attachments/:id',
    verifyAccessToken,
    authorizeAttachmentPermission(Permissions.UPDATE_CARD),
    cardController.deleteAttachment
);

// Upload or update card background
route.post(
    '/:id/background',
    verifyAccessToken,
    authorizeCardPermission(Permissions.UPDATE_CARD),
    CardBackgroundUpload.single('file'),
    cardController.uploadCardBackground
)

export default route