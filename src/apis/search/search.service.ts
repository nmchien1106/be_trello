import AppDataSource from '@/config/typeorm.config'
import { Card } from '@/entities/card.entity'
import { Board } from '@/entities/board.entity'
import { Workspace } from '@/entities/workspace.entity'
import { User } from '@/entities/user.entity'

class SearchService {
    private cardRepo = AppDataSource.getRepository(Card)
    private boardRepo = AppDataSource.getRepository(Board)
    private workspaceRepo = AppDataSource.getRepository(Workspace)
    private userRepo = AppDataSource.getRepository(User)

    async globalSearch(userId: string, keyword: string) {
        if (!keyword) {
            return {
                cards: [],
                boards: [],
                workspaces: [],
                members: []
            }
        }

        const wildKeyword = `%${keyword}%`

        // 1. Search Cards
        const cards = await this.cardRepo.createQueryBuilder('card')
            .leftJoinAndSelect('card.list', 'list')
            .leftJoinAndSelect('list.board', 'board')
            .leftJoin('board.boardMembers', 'boardMember')
            .where('(board.ownerId = :userId OR boardMember.userId = :userId)', { userId })
            .andWhere('card.isArchived = :isArchived', { isArchived: false })
            .andWhere(
                '(card.title ILIKE :keyword OR card.description ILIKE :keyword)',
                { keyword: wildKeyword }
            )
            .orderBy('card.createdAt', 'DESC')
            .take(10)
            .getMany()

        // 2. Search Boards
        const boards = await this.boardRepo.createQueryBuilder('board')
            .leftJoin('board.boardMembers', 'boardMember')
            .where('(board.ownerId = :userId OR boardMember.userId = :userId)', { userId })
            .andWhere('board.isArchived = :isArchived', { isArchived: false })
            .andWhere(
                '(board.title ILIKE :keyword OR board.description ILIKE :keyword)',
                { keyword: wildKeyword }
            )
            .orderBy('board.createdAt', 'DESC')
            .take(10)
            .getMany()

        // 3. Search Workspaces
        const workspaces = await this.workspaceRepo.createQueryBuilder('workspace')
            .leftJoin('workspace.workspaceMembers', 'workspaceMember')
            .where('(workspace.ownerId = :userId OR workspaceMember.userId = :userId)', { userId })
            .andWhere('workspace.isArchived = :isArchived', { isArchived: false })
            .andWhere(
                '(workspace.title ILIKE :keyword OR workspace.description ILIKE :keyword)',
                { keyword: wildKeyword }
            )
            .orderBy('workspace.createdAt', 'DESC')
            .take(10)
            .getMany()

        // 4. Search Users (Members) - matching username, email, or fullName
        const members = await this.userRepo.createQueryBuilder('user')
            .where('user.isActive = :isActive', { isActive: true })
            .andWhere(
                '(user.username ILIKE :keyword OR user.email ILIKE :keyword OR user.fullName ILIKE :keyword)',
                { keyword: wildKeyword }
            )
            .take(10)
            .getMany()

        return {
            cards,
            boards,
            workspaces,
            members
        }
    }
}

export default new SearchService()
