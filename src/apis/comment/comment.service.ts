import CommentRepository from './comment.repository';
import { CommentDTO } from './comment.dto';

class CommentService {
    createComment = async (commentData: any) => {
        const comment = await CommentRepository.createComment(commentData);
        return new CommentDTO(comment);
    }

    getCommentsOnCard = async (cardId: string) => {
        const comments = await CommentRepository.findCommentsOnCard(cardId);
        console.log(comments);
        return comments.map(comment => new CommentDTO(comment));
    }

    deleteComment = async (commentId: string) => {
        await CommentRepository.deleteComment(commentId);
        return;
    }

    updateComment = async (commentId: string, commentData: any) => {
        const updatedComment = await CommentRepository.updateComment(commentId, commentData);
        return new CommentDTO(updatedComment);
    }

    getCommentById = async (commentId: string) => {
        const comment = await CommentRepository.findById(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }
        console.log(new CommentDTO(comment));
        return new CommentDTO(comment);
    }
}

export default new CommentService();