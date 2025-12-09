import { NextFunction, Response } from 'express';
import { AuthRequest } from '@/types/auth-request';
import { successResponse, errorResponse } from '@/utils/response';
import listRepository from './list.repository';
import { List } from '@/entities/list.entity';
import { ListService } from './list.service';
import { Status } from '@/types/response';
import BoardRepository from './../board/board.repository';
import { Config } from '@/config/config';
import { checkBoardMember } from '@/middleware/authorization';
import { rebanlancePositions, calcPosition } from '@/utils/calcPosition';

const listService = new ListService();

class ListController {
  // --- CRUD endpoints (new branch)
  createList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'));
      const result = await listService.createList(req.body, req.user.id);
      return res.status(result.status).json(successResponse(result.status, result.message, result.data));
    } catch (err: any) {
      next(errorResponse(err.status || Status.BAD_REQUEST, err.message));
    }
  };

  getListById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED));
      const result = await listService.getListById(req.params.id, req.user.id);
      return res.status(result.status).json(successResponse(result.status, result.message, result.data));
    } catch (err: any) {
      next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message));
    }
  };

  updateList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED));
      const result = await listService.updateList(req.params.id, req.body, req.user.id);
      return res.status(result.status).json(successResponse(result.status, result.message, result.data));
    } catch (err: any) {
      next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message));
    }
  };

  archiveList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED));
      const result = await listService.updateList(req.params.id, { isArchived: true }, req.user.id);
      return res.status(result.status).json(successResponse(result.status, 'List archived successfully', result.data));
    } catch (err: any) {
      next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message));
    }
  };

  unarchiveList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED));
      const result = await listService.updateList(req.params.id, { isArchived: false }, req.user.id);
      return res.status(result.status).json(successResponse(result.status, 'List unarchived successfully', result.data));
    } catch (err: any) {
      next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message));
    }
  };

  deleteList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED));
      const result = await listService.deleteList(req.params.id, req.user.id);
      return res.status(result.status).json(successResponse(result.status, result.message));
    } catch (err: any) {
      next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message));
    }
  };

  // --- Extra endpoints (kept from HEAD)
  // POST /lists/:listId/reorder
  reorderLists = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const list = await listRepository.findListById(req.params.listId);
      if (!list) {
        return res.status(Status.NOT_FOUND).json(successResponse(Status.NOT_FOUND, 'List not found'));
      }

      const { beforeId, afterId, boardId } = req.body;

      const beforeList: List | null = beforeId ? await listRepository.findListById(beforeId) : null;
      const afterList: List | null = afterId ? await listRepository.findListById(afterId) : null;

      const beforePosition: number | null = beforeList ? beforeList.position : null;
      const afterPosition: number | null = afterList ? afterList.position : null;

      if (beforePosition !== null && afterPosition !== null && beforePosition > afterPosition) {
        return res.status(Status.BAD_REQUEST).json(successResponse(Status.BAD_REQUEST, 'Invalid positions'));
      }

      // permission: require member of board (keeps original logic)
      const hasRole = await checkBoardMember(['board_admin', 'board_member'], boardId, req.user?.id as string);
      if (!hasRole) {
        return res.status(Status.FORBIDDEN).json(successResponse(Status.FORBIDDEN, 'Permission denied'));
      }

      const newPosition = await calcPosition(beforePosition, afterPosition, boardId);

      await listRepository.updateList(req.params.listId, { position: newPosition });

      return res.status(Status.OK).json(successResponse(Status.OK, 'List reordered successfully'));
    } catch (error) {
      console.error(error);
      next(error);
    }
  };

  // POST /lists/:listId/move
  moveListToAnotherBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { boardId } = req.body;
      const listId = req.params.listId;

      const list = await listRepository.findListById(listId);
      if (!list) {
        return res.status(Status.NOT_FOUND).json(successResponse(Status.NOT_FOUND, 'List not found'));
      }

      const targetBoard = await BoardRepository.getBoardById(boardId);
      if (!targetBoard) {
        return res.status(Status.NOT_FOUND).json(successResponse(Status.NOT_FOUND, 'Target board not found'));
      }

      const hasRole = await checkBoardMember(['board_admin', 'board_member'], boardId, req.user?.id as string);
      const hasRoleSource = await checkBoardMember(['board_admin', 'board_member'], list.boardId, req.user?.id as string);
      if (!hasRole || !hasRoleSource) {
        return res.status(Status.FORBIDDEN).json(successResponse(Status.FORBIDDEN, 'Permission denied'));
      }

      if (list.boardId === boardId) {
        return res
          .status(Status.BAD_REQUEST)
          .json(successResponse(Status.BAD_REQUEST, 'List is already in the target board'));
      }

      const highestPosition = await listRepository.getHighestPositionInBoard(boardId);
      const position = highestPosition !== null ? highestPosition + Config.defaultGap : Config.defaultGap;

      await listRepository.updateList(listId, { boardId, position });

      return res.status(Status.OK).json(successResponse(Status.OK, 'List moved successfully'));
    } catch (error) {
      next(error);
    }
  };

  // POST /lists/:listId/duplicate
  duplicateList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const listId = req.params.listId;
      const { boardId, title } = req.body;

      const sourceList = await listRepository.findListById(listId);

      if (!sourceList) {
        return res.status(Status.NOT_FOUND).json(successResponse(Status.NOT_FOUND, 'List not found'));
      }

      if (sourceList.boardId !== boardId) {
        return res
          .status(Status.BAD_REQUEST)
          .json(successResponse(Status.BAD_REQUEST, 'Failed to duplicate list to the target board'));
      }

      // permission
      const hasRole = await checkBoardMember(['board_admin', 'board_member'], boardId, req.user?.id as string);
      if (!hasRole) {
        return res.status(Status.FORBIDDEN).json(successResponse(Status.FORBIDDEN, 'Permission denied'));
      }

      const newList = await listRepository.duplicateList(listId, boardId, title);

      return res.status(Status.OK).json(successResponse(Status.OK, 'List duplicated successfully', newList));
    } catch (error) {
      next(error);
    }
  };
}

export default new ListController();
