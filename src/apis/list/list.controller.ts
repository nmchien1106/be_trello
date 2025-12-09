import { NextFunction, Response } from 'express';
import { AuthRequest } from '@/types/auth-request';
import { successResponse, errorResponse } from '@/utils/response';
import { ListService } from './list.service';
import { Status } from '@/types/response';

const listService = new ListService();

class ListController {
    createList = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'));
            const result = await listService.createList(req.body, req.user.id);
            return res.status(result.status).json(successResponse(result.status, result.message, result.data));
        } catch (err: any) {
            next(errorResponse(err.status || Status.BAD_REQUEST, err.message));
        }
    }

    getListById = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED));
            const result = await listService.getListById(req.params.id, req.user.id);
            return res.status(result.status).json(successResponse(result.status, result.message, result.data));
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message));
        }
    }

    updateList = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED));
            const result = await listService.updateList(req.params.id, req.body, req.user.id);
            return res.status(result.status).json(successResponse(result.status, result.message, result.data));
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message));
        }
    }

    archiveList = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED));
            const result = await listService.updateList(req.params.id, { isArchived: true }, req.user.id);
            return res.status(result.status).json(successResponse(result.status, 'List archived successfully', result.data));
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message));
        }
    }

    unarchiveList = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED));
            const result = await listService.updateList(req.params.id, { isArchived: false }, req.user.id);
            return res.status(result.status).json(successResponse(result.status, 'List unarchived successfully', result.data));
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message));
        }
    }

    deleteList = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED));
            const result = await listService.deleteList(req.params.id, req.user.id);
            return res.status(result.status).json(successResponse(result.status, result.message));
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message));
        }
    }
}

export default new ListController();