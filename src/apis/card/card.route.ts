import { Router } from 'express'
import cardController from './card.controller'
import { verifyAccessToken } from '@/utils/jwt'
import { validateHandle } from '@/middleware/validate-handle'
import { 
    CreateCardSchema, 
    ReorderCardSchema, 
    DuplicateCardSchema, 
    MoveCardToBoardSchema 
} from './card.schema'
import { authorizeCardPermission } from '@/middleware/authorization'
import { Permissions } from '@/enums/permissions.enum'

const route = Router();
route.post('/', verifyAccessToken, cardController.createCard);

route.get('/:id', verifyAccessToken, cardController.getCardById);

route.patch('/:id', verifyAccessToken, cardController.updateCard);

route.delete('/:id', verifyAccessToken, cardController.deleteCard);

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

route.post('/', verifyAccessToken, validateHandle(CreateCardSchema), cardController.createCard)
route.get('/:id', verifyAccessToken, cardController.getCardById)
route.patch('/:id', verifyAccessToken, cardController.updateCard)
route.delete('/:id', verifyAccessToken, cardController.deleteCard)

export default route