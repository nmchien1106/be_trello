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

            return res
                .status(Status.CREATED)
                .json(successResponse(Status.CREATED, 'Label created and attached', result))
        } catch (err) {
            next(err)
        }
    }

    updateLabel = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) {
                return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            }

            const { id } = req.params
            const { color, name } = req.body

            const result = await LabelService.updateLabel(id, color, name)

            return res.status(Status.OK).json(successResponse(Status.OK, 'Label updated successfully', result))
        } catch (err) {
            next(err)
        }
    }

    getAllLabelsOnCard = async (req: Request, res: Response, next: NextFunction) => {
        try{
            if (!req.user?.id){
                return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            }

            const { cardId } = req.params

            const result = await LabelService.getAllLabelsOnCard(cardId)

            return res.status(Status.OK).json(successResponse(Status.OK, 'Get all labels on card successfullt', result))
        }catch(err){
            next(err)
        }
    }

    getLabel = async (req: Request, res: Response, next: NextFunction) => {
        try{
            if (!req.user?.id) {
                return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            }

            const { id } = req.params

            const result = await LabelService.getLabel(id)

            return res.status(Status.OK).json(successResponse(Status.OK, 'Get label successfully', result))
        }catch(err){
            next(err)
        }
    }

    deleteLabel = async (req: Request, res: Response, next: NextFunction) => {
        try{
            if (!req.user?.id) {
                return next(errorResponse(Status.UNAUTHORIZED, 'User info missing',))
            }

            const { id } = req.params
            
            const result = await LabelService.deleteLabel(id)

            return res.status(Status.OK).json(successResponse(Status.OK, 'Delete label successfully'))
        }catch(err){
            next(err)
        }
    }
}

export default new LabelController()
