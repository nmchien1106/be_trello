import { NextFunction, Response } from 'express';
import { AuthRequest } from '@/types/auth-request';
import { successResponse, errorResponse } from '@/utils/response';
import listService from './list.service';
import { Status } from '@/types/response';

class ListController {
  createList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'));
      const result = await listService.createList(req.body, req.user.id);
      return res.status(result.status).json(successResponse(result.status, result.message, result.data));
    } catch (err: any) {
      next(errorResponse(err.status || Status.BAD_REQUEST, err.message || 'Bad request'));
    }
  };

  getListById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'));
      const result = await listService.getListById(req.params.id, req.user.id);
      return res.status(result.status).json(successResponse(result.status, result.message, result.data));
    } catch (err: any) {
      next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message || 'Server error'));
    }
  };

  updateList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'));
      const result = await listService.updateList(req.params.id, req.body, req.user.id);
      return res.status(result.status).json(successResponse(result.status, result.message, result.data));
    } catch (err: any) {
      next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message || 'Server error'));
    }
  };

  archiveList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'));
      const result = await listService.updateList(req.params.id, { isArchived: true }, req.user.id);
      return res.status(result.status).json(successResponse(result.status, 'List archived successfully', result.data));
    } catch (err: any) {
      next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message || 'Server error'));
    }
  };

  unarchiveList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'));
      const result = await listService.updateList(req.params.id, { isArchived: false }, req.user.id);
      return res.status(result.status).json(successResponse(result.status, 'List unarchived successfully', result.data));
    } catch (err: any) {
      next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message || 'Server error'));
    }
  };

  deleteList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'));
      const result = await listService.deleteList(req.params.id, req.user.id);
      return res.status(result.status).json(successResponse(result.status, result.message));
    } catch (err: any) {
      next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message || 'Server error'));
    }
  };
}

export default new ListController();