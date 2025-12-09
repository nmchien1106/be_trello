import { NextFunction, Response } from 'express';
import { AuthRequest } from '@/types/auth-request';
import { successResponse, errorResponse } from '@/utils/response';
import { CardService } from './card.service';
import { Status } from '@/types/response';

const cardService = new CardService();

class CardController {
    createCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'));
            
            const result = await cardService.createCard(req.body, req.user.id);
            return res.status(result.status).json(successResponse(result.status, result.message, result.data));
        } catch (err: any) {
            next(errorResponse(err.status || Status.BAD_REQUEST, err.message));
        }
    }

    getAllCardsInList = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED));
            
            const { listId } = req.params;
            const result = await cardService.getCardsByList(listId, req.user.id);
            return res.status(result.status).json(successResponse(result.status, result.message, result.data));
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message));
        }
    }
}

export default new CardController();