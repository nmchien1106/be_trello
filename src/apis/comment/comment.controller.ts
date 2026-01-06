import { AuthRequest } from "@/types/auth-request";
import commentService from "./comment.service";
import { NextFunction, Response } from "express";
import { Status } from "@/types/response";
import { successResponse } from "@/utils/response";

class CommentController {
    constructor(
        private service = commentService
    ) {}

    createComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const commentData = req.body;
            commentData.userId = req.user?.id;
            const newComment = await this.service.createComment(commentData);
            res.status(Status.CREATED).json(successResponse(Status.CREATED, 'Comment created successfully', newComment));
        }
        catch(err){
            next(err);
        }
    }

    getCommentsOnCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const cardId = req.params.cardId;
            const comments = await this.service.getCommentsOnCard(cardId);
            res.status(Status.OK).json(successResponse(Status.OK, 'Comments fetched successfully', comments));
        }
        catch(err){
            console.log(err)
            next(err);
        }
    }

    deleteComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const commentId = req.params.commentId;
            await this.service.deleteComment(commentId);
            res.status(Status.OK).json(successResponse(Status.OK, 'Comment deleted successfully', null));
        }
        catch(err){
            next(err);
        }
    }

    updateComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const commentId = req.params.commentId;
            const commentData = req.body;
            const updatedComment = await this.service.updateComment(commentId, commentData);
            res.status(Status.OK).json(successResponse(Status.OK, 'Comment updated successfully', updatedComment));
        }
        catch(err){
            next(err);
        }
    }

    getCommentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const commentId = req.params.commentId;
            const comment = await this.service.getCommentById(commentId);
            res.status(Status.OK).json(successResponse(Status.OK, 'Comment fetched successfully', comment));
        }
        catch(err){
            next(err);
        }
    }

}

export default new CommentController();