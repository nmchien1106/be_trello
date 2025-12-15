import { NextFunction, Response } from 'express';
import { AuthRequest } from '@/types/auth-request';
import { successResponse, errorResponse } from '@/utils/response';
import cardService from './card.service';
import { Status } from '@/types/response';

class CardController {
  createCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'));
      const result = await cardService.createCard(req.body, req.user.id);
      return res.status(result.status).json(successResponse(result.status, result.message, result.data));
    } catch (err: any) {
      next(errorResponse(err.status || Status.BAD_REQUEST, err.message || 'Bad request'));
    }
  };

  getAllCardsInList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'));
      const { listId } = req.params;
      const result = await cardService.getCardsByList(listId, req.user.id);
      return res.status(result.status).json(successResponse(result.status, result.message, result.data));
    } catch (err: any) {
      next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message || 'Server error'));
    }
  };

  updateCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED));
        const result = await cardService.updateCard(req.params.id, req.body, req.user.id);
        return res.status(result.status).json(successResponse(result.status, result.message, result.data));
    } catch (err: any) {
        next(errorResponse(err.status || 500, err.message));
    }
}

  deleteCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED));
        const result = await cardService.deleteCard(req.params.id, req.user.id);
        return res.status(result.status).json(successResponse(result.status, result.message));
    } catch (err: any) {
        next(errorResponse(err.status || 500, err.message));
    }
}
}

export default new CardController();