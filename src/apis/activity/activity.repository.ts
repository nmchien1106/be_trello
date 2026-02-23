import { Repository } from 'typeorm'
import { Activity } from '@/entities/activity.entity'

export interface IActivityRepository {
    create(data: Partial<Activity>): Promise<Activity | null>
    /** fetch a single activity by its id */
    findById(id: string): Promise<Activity | null>
    findByBoard(boardId: string, limit?: number, offset?: number): Promise<Activity[]>
    findByCard(cardId: string, limit?: number, offset?: number): Promise<Activity[]>
    findByUser(userId: string, limit?: number, offset?: number): Promise<Activity[]>
    findByComment(commentId: string, limit?: number, offset?: number): Promise<Activity[]>
    updateActivity(id: string, data: Partial<Activity>): Promise<Activity | null>
    deleteActivity(id: string): Promise<boolean>
}
export class ActivityRepository implements IActivityRepository {
    constructor(private repo: Repository<Activity>) {}

    async create(data: Partial<Activity>) {
        try {
            const activity = this.repo.create(data)
            return await this.repo.save(activity)
        } catch (error) {
            // duplicate eventId -> ignore
            return null
        }
    }

    async findById(id: string) {
        return this.repo.findOne({ where: { id }, relations: { actor: true, board: true, card: true } })
    }

    async findByBoard(boardId: string, limit = 20, offset = 0) {
        return this.repo.find({
            where: { boardId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
            relations: { actor: true, card: true }
        })
    }

    async findByCard(cardId: string, limit = 20, offset = 0) {
        return this.repo.find({
            where: { cardId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
            relations: { actor: true }
        })
    }

    async findByUser(userId: string, limit = 20, offset = 0) {
        return this.repo.find({
            where: { actorId: userId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
            relations: { board: true, card: true }
        })
    }

    async findByComment(commentId: string, limit = 20, offset = 0) {
        // commentId is stored inside payload, which is jsonb
        return this.repo
            .createQueryBuilder('activity')
            .where("activity.payload ->> 'commentId' = :commentId", { commentId })
            .orderBy('activity.createdAt', 'DESC')
            .take(limit)
            .skip(offset)
            .leftJoinAndSelect('activity.actor', 'actor')
            .leftJoinAndSelect('activity.board', 'board')
            .leftJoinAndSelect('activity.card', 'card')
            .getMany()
    }

    async updateActivity(id: string, data: Partial<Activity>) {
        const existing = await this.repo.findOne({ where: { id } })
        if (!existing) return null
        const updated = this.repo.merge(existing, data)
        return this.repo.save(updated)
    }

    async deleteActivity(id: string) {
        const result = await this.repo.delete(id)
        // affected can be null in some drivers, so coalesce to 0
        return (result.affected ?? 0) > 0
    }
}
