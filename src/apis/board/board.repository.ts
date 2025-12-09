import { Board } from '@/entities/board.entity'
import AppDataSource from '@/config/typeorm.config'
import { Role } from '@/entities/role.entity'
import { User } from '@/entities/user.entity'
import { BoardMembers } from '@/entities/board-member.entity'
import { Workspace } from '@/entities/workspace.entity'
import { WorkspaceMembers } from '@/entities/workspace-member.entity'
import { Brackets, Repository } from 'typeorm'
import { Permissions } from '@/enums/permissions.enum';

class BoardRepository {
    private repo = AppDataSource.getRepository(Board)
    private roleRepo = AppDataSource.getRepository(Role)
    private userRepo = AppDataSource.getRepository(User)
    private boardMembersRepository = AppDataSource.getRepository(BoardMembers)
    private workspaceRepo = AppDataSource.getRepository(Workspace)
    async findAll(): Promise<Board[]> {
        return this.repo.find()
    }

    getBoardById = async (boardId: string): Promise<Board | null> => {
        return this.repo.findOne({ where: { id: boardId } })
    }
    updateBoard = async (boardId: string, updateData: Partial<Board>): Promise<Board | null> => {
        await this.repo.update(boardId, updateData)
        return this.repo.findOne({ where: { id: boardId } })
    }

    deleteBoard = async (boardId: string): Promise<void> => {
        await this.repo.delete(boardId)
    }
    async findMemberByEmail(boardId: string, email: string): Promise<boolean> {
        const board = await this.repo.findOne({
            where: { id: boardId },
            relations: { boardMembers: { user: true } }
        })
        if (!board) {
            throw new Error('Board not found')
        }
        return board.boardMembers.some((m) => m.user.email === email)
    }

    findMemberByBoardId = async (boardId: string) => {
        const board = await this.repo.findOne({
            where: { id: boardId },
            relations: { boardMembers: { user: true, role: true } }
        })

        if (!board) throw new Error('Board not found')

        return board.boardMembers
    }

    async findMemberByUserId(boardId: string, userId: string): Promise<BoardMembers | null> {
        const boardMemberRepo = AppDataSource.getRepository(BoardMembers)
        const member = await boardMemberRepo.findOne({
            where: {
                board: { id: boardId },
                user: { id: userId }
            },
            relations: ['role', 'user', 'board']
        })
        return member || null
    }

    async addMemberToBoard(boardId: string, userId: string, roleName: string): Promise<void> {
        const board = await this.repo.findOne({
            where: { id: boardId },
            relations: { boardMembers: { user: true } }
        })
        if (!board) {
            throw new Error('Board not found')
        }
        const userRepo = AppDataSource.getRepository(User)
        const user = await userRepo.findOne({ where: { id: userId } })
        const role: Role | null = await this.roleRepo.findOne({ where: { name: roleName } })
        if (!user) {
            throw new Error('User not found')
        }
        const boardMember = AppDataSource.getRepository('board_members').create({
            board: board,
            user: user,
            role: role!
        })
        console.log('Board Member Entity:', boardMember)
        await AppDataSource.getRepository('board_members').save(boardMember)
    }

    async changeOwner(boardId: string, currentOwnerId: string, newOwnerId: string) {
        const board = await this.repo.findOne({
            where: { id: boardId },
            relations: ['owner']
        })

        if (!board) {
            throw new Error('Board not found')
        }

        if (board.owner.id !== currentOwnerId) {
            throw new Error('You are not the board owner')
        }

        if (newOwnerId === currentOwnerId) {
            throw new Error('New owner must be different from current owner')
        }

        const newOwnerRecord = await this.boardMembersRepository.findOne({
            where: { board: { id: boardId }, user: { id: newOwnerId } },
            relations: ['role', 'user']
        })

        if (!newOwnerRecord) {
            throw new Error('New owner must be a board member')
        }

        const adminRole = await this.roleRepo.findOne({ where: { name: 'board_admin' } })
        const memberRole = await this.roleRepo.findOne({ where: { name: 'board_member' } })

        if (!adminRole || !memberRole) {
            throw new Error('Roles not found')
        }

        await this.boardMembersRepository.update(
            { board: { id: boardId }, user: { id: currentOwnerId } },
            { role: memberRole }
        )

        newOwnerRecord.role = adminRole
        await this.boardMembersRepository.save(newOwnerRecord)

        board.owner = { id: newOwnerId } as User
        await this.repo.save(board)

        return {
            message: 'Change owner successfully',
            newOwnerId
        }
    }

    async updateMemberRole(boardId: string, userId: string, roleName: string): Promise<void> {
        const board = await this.repo.findOne({
            where: { id: boardId },
            relations: { boardMembers: { user: true } }
        })
        if (!board) {
            throw new Error('Board not found')
        }
        const user = await this.userRepo.findOne({ where: { id: userId } })
        const role: Role | null = await this.roleRepo.findOne({ where: { name: roleName } })
        if (!user) {
            throw new Error('User not found')
        }
        await this.boardMembersRepository.update({ board: { id: boardId }, user: { id: userId } }, { role: role! })
    }

    async removeMember(boardId: string, userId: string): Promise<void> {
        const board = await this.repo.findOne({
            where: { id: boardId },
            relations: { boardMembers: { user: true } }
        })
        if (!board) {
            throw new Error('Board not found')
        }
        const user = await this.userRepo.findOne({ where: { id: userId } })
        if (!user) {
            throw new Error('User not found')
        }
        await AppDataSource.getRepository('board_members').delete({ board: { id: boardId }, user: { id: userId } })
    }

    async countOwners(boardId: string): Promise<number> {
        return this.boardMembersRepository.count({
            where: {
                board: { id: boardId },
                role: { name: 'board_admin' }
            }
        })
    }
    async getPublicBoards() {
        return this.repo.find({
            where: { permissionLevel: 'public', isArchived: false },
            select: ['id', 'title', 'description','permissionLevel', 'backgroundPublicId', 'createdAt']
        })
    }

    async getAllBoardsForUser(userId: string) {
        return this.repo.find({
            where: [
                { permissionLevel: 'public', isArchived: false },
                { isArchived: false, boardMembers: { user: { id: userId } } },
                {
                    permissionLevel: 'workspace',
                    isArchived: false,
                    workspace: { workspaceMembers: { user: { id: userId } } }
                }
            ],
            relations: ['workspace'],
            select: {
                id: true,
                title: true,
                description: true,
                permissionLevel: true,
                backgroundPath: true,
                createdAt: true,
                updatedAt: true,
                workspace: { id: true, title: true }
            },
            order: { createdAt: 'DESC' }
        })
    }
    async getBoardDetail(boardId: string, userId: string) {
        const board = await this.repo.findOne({
            where: { id: boardId, isArchived: false },
            relations: ['workspace', 'owner']
        })

        if (!board) return null

        let hasAccess = false

        if (board.permissionLevel === 'public') hasAccess = true
        else if (board.permissionLevel === 'workspace') {
            const isWsMember = await AppDataSource.getRepository(WorkspaceMembers).exists({
                where: { workspace: { id: board.workspace.id }, user: { id: userId } }
            })
            if (isWsMember) hasAccess = true
        }

        if (!hasAccess) {
            const isBoardMember = await AppDataSource.getRepository(BoardMembers).exists({
                where: { board: { id: board.id }, user: { id: userId } }
            })
            if (isBoardMember) hasAccess = true
        }

        if (!hasAccess) throw new Error('Permission denied')

        return board
    }

    async createBoard(data: Partial<Board>, workspaceId: string, userId: string) {
        return await AppDataSource.transaction(async (manager) => {
            const workspace = await manager.findOne(Workspace, { where: { id: workspaceId } })
            if (!workspace) throw new Error('Workspace not found')

            const adminRole = await manager.findOne(Role, { where: { name: 'board_admin' } })
            if (!adminRole) throw new Error('Role board_admin not found')

            const newBoard = manager.create(Board, {
                ...data,
                workspace: workspace,
                owner: { id: userId }
            })
            const savedBoard = await manager.save(newBoard)

            const member = manager.create(BoardMembers, {
                board: savedBoard,
                user: { id: userId },
                role: adminRole
            })
            await manager.save(member)

            return {
                ...savedBoard,
                workspaceId: workspace.id,
                ownerId: userId,
                permissionLevel: savedBoard.permissionLevel
            }
        })
    }

    async findTemplates() {
        return this.repo.find({
            where: { isTemplate: true }
        })
    }

    async getTemplateDetail(boardId: string) {
        return this.repo.findOne({
            where: { id: boardId, isTemplate: true },
            relations: ['lists', 'lists.cards']
        })
    }

    async findTemplateById(templateId: string, copyCard: boolean) {
        return this.repo.findOne({
            where: { id: templateId, isTemplate: true },
            relations: copyCard ? ['lists', 'lists.cards'] : ['lists']
        })
    }

    // Permission helper (kept from new branch)
    async hasPermission(userId: string, boardId: string, requiredPermission: string): Promise<boolean> {
        const board = await this.repo.findOne({ where: { id: boardId }, relations: ['owner'] });
        if (!board) return false;

        if (board.owner?.id === userId) return true;

        const member = await this.boardMembersRepository.findOne({
            where: { board: { id: boardId }, user: { id: userId } },
            relations: ['role', 'role.permissions']
        });

        if (!member || !member.role) return false;

        return member.role.permissions.some(p => p.name === requiredPermission);
    }
}
export default new BoardRepository()
