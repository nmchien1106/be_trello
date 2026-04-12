import { Router } from 'express'
import LabelController from './label.controller'
import { verifyAccessToken } from '@/utils/jwt'
import { checkBoardPermission, checkCardPermission, checkLabelPermission } from '@/middleware/authorization'
import { PERMISSIONS } from '@/enums/permissions.enum'
import { validateHandle } from '@/middleware/validate-handle'
import { AssignExistingLabelBodySchema, CreateLabelBodySchema, UpdateLabelBodySchema } from '@/apis/label/label.schema'
const router = Router()

//Create label
router.post(
    '/cards/:cardId',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.UPDATE_CARD),
    validateHandle(CreateLabelBodySchema),
    LabelController.createLabel
)

//Update label
router.patch(
    '/:id',
    verifyAccessToken,
    checkLabelPermission(PERMISSIONS.UPDATE_CARD),
    validateHandle(UpdateLabelBodySchema),
    LabelController.updateLabel
)

//Get all label on card
router.get(
    '/cards/:cardId',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.READ_CARD),
    LabelController.getAllLabelsOnCard
)

//Get all labels on board
router.get(
    '/boards/:boardId',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.READ_BOARD),
    LabelController.getAllLabelsOnBoard
)

//Assign existing label to card
router.post(
    '/cards/:cardId/assign',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.UPDATE_CARD),
    validateHandle(AssignExistingLabelBodySchema),
    LabelController.assignExistingLabelToCard
)

//Unassign existing label from card
router.post(
    '/cards/:cardId/unassign',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.UPDATE_CARD),
    validateHandle(AssignExistingLabelBodySchema),
    LabelController.unassignExistingLabelFromCard
)

//Get label
router.get('/:id', verifyAccessToken, checkLabelPermission(PERMISSIONS.READ_CARD), LabelController.getLabel)

//Delete label
router.delete('/:id', verifyAccessToken, checkLabelPermission(PERMISSIONS.UPDATE_CARD), LabelController.deleteLabel)

export default router
