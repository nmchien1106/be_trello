import { Comment } from '@/entities/comment.entity'
import AppDataSource from '@/config/typeorm.config'
import { da } from 'zod/locales'

class CommentRepository {
    private repo = AppDataSource.getRepository(Comment)
    findById = async (id: string): Promise<Comment | null> => {
        return this.repo.findOne({ where: { id }, relations: ['user', 'card'] })
    }

    createComment = async (data: any): Promise<Comment> => {
        const comment = this.repo.create({
            content: data.content,
            card: { id: data.cardId },
            user: { id: data.userId }
        })
        return this.repo.save(comment)
    }

    deleteComment = async (id: string): Promise<void> => {
        await this.repo.delete(id)
    }

    updateComment = async (id: string, data: Partial<Comment>): Promise<Comment> => {
        await this.repo.update(id, data)
        return this.findById(id) as Promise<Comment>
    }

    findCommentsOnCard = async (cardId: string): Promise<Comment[]> => {
        return this.repo.find({ where: { card: { id: cardId } }, relations: ['user']})
    }
}

export default new CommentRepository()
