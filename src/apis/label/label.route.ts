import { Router } from 'express'
import LabelController from './label.controller'
import { verifyAccessToken } from '@/utils/jwt'
import { authorizeCardPermission, authorizeLabelPermission } from '@/middleware/authorization'
import { Permissions } from '@/enums/permissions.enum'
import { validateHandle } from '@/middleware/validate-handle'
import { CreateLabelBodySchema, UpdateLabelBodySchema } from '@/apis/label/label.schema'
const router = Router()

//Create label
router.post(
    '/cards/:cardId',
    verifyAccessToken,
    authorizeCardPermission(Permissions.UPDATE_CARD),
    validateHandle(CreateLabelBodySchema),
    LabelController.createLabel
)

//Update label
router.patch(
    '/:id',
    verifyAccessToken,
    authorizeLabelPermission(Permissions.UPDATE_CARD),
    validateHandle(UpdateLabelBodySchema),
    LabelController.updateLabel
)

//Get all label on card
router.get(
  '/cards/:cardId',
  verifyAccessToken,
  authorizeCardPermission(Permissions.READ_CARD),
  LabelController.getAllLabelsOnCard
)

//Get label
router.get(
  '/:id',
  verifyAccessToken,
  authorizeLabelPermission(Permissions.READ_CARD),
  LabelController.getLabel
)

export default router
