import { Router } from 'express'
import LabelController from './label.controller'
import { verifyAccessToken } from '@/utils/jwt'
import { authorizeCardPermission } from '@/middleware/authorization'
import { Permissions } from '@/enums/permissions.enum';
import { validateHandle } from '@/middleware/validate-handle'
import { CreateLabelBodySchema } from '@/apis/label/label.schema'
const router = Router()

router.post(
  '/cards/:cardId',
  verifyAccessToken,
  authorizeCardPermission(Permissions.UPDATE_CARD),
  validateHandle(CreateLabelBodySchema),
  LabelController.createLabel
)

export default router
