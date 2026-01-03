import { NextFunction, Request, Response } from 'express'
import { successResponse, errorResponse } from '@/utils/response'
import { Status } from '@/types/response'
import LabelService from './label.service'

class LabelController {
  createLabel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
      }

      const { cardId } = req.params
      const { color, name } = req.body

      const result = await LabelService.createLabel(cardId, color, name)

      return res.status(Status.CREATED).json(successResponse(Status.CREATED, 'Label created and attached', result))
    } catch (err) {
      next(err)
    }
  }
}

export default new LabelController()
