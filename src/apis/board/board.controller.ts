import { NextFunction, Response, Request } from 'express'
import { errorResponse, successResponse } from '@/utils/response'
import { Status } from '@/types/response'
import AppDataSource from '@/config/typeorm.config'
import BoardRepository from './board.repository'
import { AuthRequest } from '@/types/auth-request'
import { generateToken } from '@/utils/jwt'
import generateNumericOTP from '@/utils/generateOTP'
import { encode } from 'punycode'
import redisClient from '@/config/redis.config'
import { Config } from '@/config/config'
import { User } from '@/entities/user.entity'
import emailTransporter from '@/config/email.config'
import { Board } from '@/entities/board.entity'
import { BoardMembers } from '@/entities/board-member.entity'
import { Role } from '@/entities/role.entity'
import { List } from '@/entities/list.entity'
import { Card } from '@/entities/card.entity'
import { Workspace } from '@/entities/workspace.entity'
import userRepository from '../users/user.repository'
import { BoardService } from './board.service'
import { CreateBoardDto } from './board.dto'
import { WorkspaceMembers } from '@/entities/workspace-member.entity'
import { CardMembers } from '@/entities/card-member.entity'
import { Permissions } from '@/enums/permissions.enum'
import { Auth } from 'typeorm'
import boardRepository from './board.repository'
import { EventBus } from '@/events/event-bus'
import { DomainEvent } from '@/events/interface'
import { EventType } from '@/enums/event-type.enum'
import crypto from 'crypto'

const roleRepo = AppDataSource.getRepository(Role)
const listRepo = AppDataSource.getRepository(List)
const cardRepo = AppDataSource.getRepository(Card)
const boardRepo = AppDataSource.getRepository(Board)
const boardMemberRepo = AppDataSource.getRepository(BoardMembers)
const workspaceRepo = AppDataSource.getRepository(Workspace)
const cardMemberRepo = AppDataSource.getRepository(CardMembers)
const boardService = new BoardService()

class BoardController {
    public seedTemplates = async (req: AuthRequest, res: Response) => {
        try {
            const boardRepo = AppDataSource.getRepository(Board)
            const listRepo = AppDataSource.getRepository(List)
            const cardRepo = AppDataSource.getRepository(Card)
            const userRepo = AppDataSource.getRepository(User)

            const admin = await userRepo.findOne({ where: {} })
            if (!admin) return res.status(400).json({ message: 'No users found' })

            const templates = [
                {
                    title: 'Project Management',
                    description: 'Manage any project from start to finish with this template.',
                    category: 'Project Management',
                    backgroundPath:
                        'https://images.unsplash.com/photo-1454165833767-02a6e901f014?q=80&w=2070&auto=format&fit=crop',
                    lists: [
                        { title: 'Resources', cards: ['Project Brief', 'Meeting Notes', 'Brand Guidelines'] },
                        { title: 'To Do', cards: ['Task 1', 'Task 2', 'Task 3'] },
                        { title: 'Doing', cards: ['Task 4'] },
                        { title: 'Done', cards: ['Task 5'] }
                    ]
                },
                {
                    title: 'Agile Board',
                    description: 'A classic agile workflow for software development teams.',
                    category: 'Engineering',
                    backgroundPath:
                        'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2069&auto=format&fit=crop',
                    lists: [
                        { title: 'Backlog', cards: ['Bug: Login fix', 'Feature: User roles', 'Refactor: API'] },
                        { title: 'Sprint Backlog', cards: ['UI: Dashboard redesign'] },
                        { title: 'In Progress', cards: ['Auth: JWT implementation'] },
                        { title: 'Review', cards: [] },
                        { title: 'Done', cards: ['Database: Schema setup'] }
                    ]
                },
                {
                    title: 'Marketing Plan',
                    description: 'Launch your next marketing campaign with ease.',
                    category: 'Marketing',
                    backgroundPath:
                        'https://images.unsplash.com/photo-1533750349088-cd871a723591?q=80&w=2070&auto=format&fit=crop',
                    lists: [
                        { title: 'Strategy', cards: ['Target Audience', 'Competitor Analysis'] },
                        { title: 'Content', cards: ['Social Media Posts', 'Blog Articles'] },
                        { title: 'Channels', cards: ['Email', 'Ads', 'Events'] }
                    ]
                }
            ]

            for (const t of templates) {
                let board = await boardRepo.findOne({ where: { title: t.title, isTemplate: true } })
                if (!board) {
                    board = boardRepo.create({
                        title: t.title,
                        description: t.description,
                        category: t.category,
                        isTemplate: true,
                        permissionLevel: 'public',
                        backgroundPath: t.backgroundPath,
                        owner: admin
                    })
                    board = await boardRepo.save(board)

                    for (let i = 0; i < t.lists.length; i++) {
                        const l = t.lists[i]
                        const list = await listRepo.save(
                            listRepo.create({
                                title: l.title,
                                position: (i + 1) * 1000,
                                board: board,
                                createdBy: admin
                            })
                        )

                        for (let j = 0; j < l.cards.length; j++) {
                            const cTitle = l.cards[j]
                            await cardRepo.save(
                                cardRepo.create({
                                    title: cTitle,
                                    position: (j + 1) * 1000,
                                    list: list,
                                    createdBy: admin
                                })
                            )
                        }
                    }
                }
            }
            return res.status(200).json({ message: 'Templates seeded successfully' })
        } catch (err) {
            console.error(err)
            return res.status(500).json({ message: 'Internal server error' })
        }
    }

    updateBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { boardId } = req.params
            const data = req.body
            const userId = req.user?.id

            const updatedBoard = await BoardRepository.updateBoard(boardId, data)
            if (!updatedBoard) {
                return next(errorResponse(Status.NOT_FOUND, 'Board not found'))
            }

            // Publish board updated event for activity logging
            const event: DomainEvent = {
                eventId: crypto.randomUUID(),
                type: EventType.BOARD_UPDATED,
                boardId: boardId,
                actorId: userId,
                payload: { title: updatedBoard.title, changes: data }
            }
            EventBus.publish(event)

            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Board updated successfully',
                data: updatedBoard
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to update board field', err))
        }
    }

    archiveBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { boardId } = req.params
            const userId = req.user?.id

            const board = await BoardRepository.getBoardById(boardId)
            if (!board) {
                return next(errorResponse(Status.NOT_FOUND, 'Board not found'))
            }

            // Check permission: Must be board member with manage permission, board owner, or workspace admin
            const hasAccess = await this.canManageBoard(userId, boardId, board)
            if (!hasAccess) {
                return next(errorResponse(Status.FORBIDDEN, 'You do not have permission to archive this board'))
            }

            if (board.isArchived) {
                return next(errorResponse(Status.BAD_REQUEST, 'Board is already archived'))
            }
            const updatedBoard = await BoardRepository.updateBoard(boardId, { isArchived: true })

            const event: DomainEvent = {
                eventId: crypto.randomUUID(),
                type: EventType.BOARD_ARCHIVED,
                boardId: boardId,
                actorId: userId,
                payload: { title: board.title }
            }
            EventBus.publish(event)

            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Board archived successfully'
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to archive board', err))
        }
    }

    reopenBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { boardId } = req.params
            const userId = req.user?.id

            const board = await BoardRepository.getBoardById(boardId)
            if (!board) {
                return next(errorResponse(Status.NOT_FOUND, 'Board not found'))
            }

            const hasAccess = await this.canManageBoard(userId, boardId, board)
            if (!hasAccess) {
                return next(errorResponse(Status.FORBIDDEN, 'You do not have permission to reopen this board'))
            }

            if (!board.isArchived) {
                return next(errorResponse(Status.BAD_REQUEST, 'Board is not archived'))
            }
            const updatedBoard = await BoardRepository.updateBoard(boardId, { isArchived: false })

            // Publish board restored event for activity logging
            const event: DomainEvent = {
                eventId: crypto.randomUUID(),
                type: EventType.BOARD_RESTORED,
                boardId: boardId,
                actorId: userId,
                payload: { title: board.title }
            }
            EventBus.publish(event)

            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Board reopened successfully'
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to reopen board', err))
        }
    }

    private canManageBoard = async (userId: string, boardId: string, _board: any): Promise<boolean> => {
        // Load board with owner and workspace
        const boardWithOwner = await boardRepo.findOne({ where: { id: boardId }, relations: ['owner', 'workspace'] })
        if (!boardWithOwner) return false

        // 1. Board owner can always manage
        if (boardWithOwner.owner?.id === userId) return true

        // 2. Any board member can manage (board_admin has board:manage)
        const boardMembership = await boardMemberRepo.findOne({
            where: { board: { id: boardId }, user: { id: userId } },
            relations: ['role']
        })
        if (boardMembership) return true

        // 3. Any workspace member can manage boards in their workspace
        if (boardWithOwner.workspace?.id) {
            const wsMember = await AppDataSource.getRepository(WorkspaceMembers).findOne({
                where: { workspace: { id: boardWithOwner.workspace.id }, user: { id: userId } }
            })
            if (wsMember) return true
        }

        return false
    }

    deleteBoardPerrmanently = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { boardId } = req.params
            const userId = req.user?.id

            const board = await BoardRepository.getBoardById(boardId)
            if (!board) {
                return next(errorResponse(Status.NOT_FOUND, 'Board not found'))
            }

            await BoardRepository.deleteBoard(boardId)

            const event: DomainEvent = {
                eventId: crypto.randomUUID(),
                type: EventType.BOARD_DELETED,
                boardId: boardId,
                actorId: userId,
                payload: { title: board.title }
            }
            EventBus.publish(event)

            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Board deleted permanently'
            })
        } catch (err: any) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to delete board', err))
        }
    }

    uploadBoardBackground = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { boardId } = req.params
            if (!req.file) {
                return next(errorResponse(Status.BAD_REQUEST, 'No file uploaded'))
            }

            const { path, filename } = req.file as any
            const updatedBoard = await BoardRepository.updateBoard(boardId, {
                backgroundPath: path,
                backgroundPublicId: filename
            })
            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Board background uploaded successfully',
                data: updatedBoard
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to upload board background', err))
        }
    }

    inviteByEmail = async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { email, role } = req.body
        const boardId = req.params.boardId

        if (!email) {
            return next(errorResponse(Status.BAD_REQUEST, 'Email is required'))
        }

        if (email === req.user!.email) {
            return next(errorResponse(Status.BAD_REQUEST, 'Cannot invite yourself'))
        }

        try {
            const isExistRole = await roleRepo.findOne({ where: { name: role } })
            if (!isExistRole) {
                return next(errorResponse(Status.NOT_FOUND, 'Role not found'))
            }

            const user = await userRepository.findByEmailAsync(email)
            if (!user) {
                return res.status(Status.FORBIDDEN).json(errorResponse(Status.FORBIDDEN, 'User not found'))
            }

            const isMember = await BoardRepository.findMemberByEmail(boardId, email)
            if (isMember) {
                return res.status(Status.FORBIDDEN).json(errorResponse(Status.FORBIDDEN, 'Already a member'))
            }

            const token = await this.sendInvitationEmail(boardId, email, isExistRole.name)

            return res.status(Status.OK).json(successResponse(Status.OK, 'Invitation sent successfully', { token }))
        } catch (err) {
            return next(err)
        }
    }

    sendInvitationEmail = async (boardId: string, email: string, role: string) => {
        const token = crypto.randomUUID()

        redisClient.setEx(`invite:${token}`, 7 * 24 * 60 * 60, JSON.stringify({ boardId, email, role }))

        const inviteLink = `${Config.corsOrigin}/join-board?token=${token}`

        const mailOptions = {
            from: Config.emailUser,
            to: email,
            subject: 'Invitation to join board',
            html: `
                <p>You have been invited to join the board as <b>${role}</b>.</p>
                <a href="${inviteLink}">${inviteLink}</a>
            `
        }

        emailTransporter.sendMail(mailOptions)
        return token
    }

    async joinBoard(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { token } = req.query
            let dataStr = await redisClient.get(`invite:${token}`)
            let type = 'invite'

            if (!dataStr) {
                dataStr = await redisClient.get(`shareLink:${token}`)
                type = 'shareLink'
            }

            if (!dataStr) {
                return next(errorResponse(Status.BAD_REQUEST, 'Invalid or expired token'))
            }
            const { boardId, role = 'board_member' } = JSON.parse(dataStr)

            const userId = req.user!.id

            const isMember = await BoardRepository.findMemberByUserId(boardId, userId)
            if (isMember) {
                return res
                    .status(Status.OK)
                    .json(successResponse(Status.OK, 'Already a member of the board', { boardId }))
            }

            await BoardRepository.addMemberToBoard(boardId, userId, role)

            if (type === 'invite') {
                await redisClient.del(`invite:${token}`)
            }

            return res.status(Status.OK).json(successResponse(Status.OK, 'Successfully joined the board', { boardId }))
        } catch (err) {
            next(err)
        }
    }

    async createShareLink(req: AuthRequest, res: Response, next: NextFunction) {
        const user = req.user

        const boardId = req.params.boardId
        const board = BoardRepository.getBoardById(boardId)
        if (!board) {
            return next(errorResponse(Status.NOT_FOUND, 'Board not found'))
        }
        const boardMemberRepository = AppDataSource.getRepository(BoardMembers)
        const membership = await boardMemberRepository.findOne({
            where: {
                board: { id: boardId },
                user: { id: user.id }
            }
        })
        if (!membership) {
            return next(errorResponse(Status.NOT_FOUND, 'Membership not found'))
        }

        const oldToken = await redisClient.get(`shareBoardToken:${boardId}`)
        if (oldToken) {
            await redisClient.del(`shareLink:${oldToken}`)
        }

        const token = crypto.randomUUID()

        const payload = {
            boardId
        }

        await redisClient.setEx(`shareBoardToken:${boardId}`, 7 * 24 * 60 * 60, token)
        await redisClient.setEx(`shareLink:${token}`, 7 * 24 * 60 * 60, JSON.stringify(payload))

        const link = `${Config.corsOrigin}/join-board?token=${token}`
        return res.status(Status.OK).json(successResponse(Status.OK, 'Share link created', { link }))
    }

    revokeShareLink = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const boardId = req.params.boardId
            const token = await redisClient.get(`shareBoardToken:${boardId}`)
            if (token) {
                await redisClient.del(`shareLink:${token}`)
                await redisClient.del(`shareBoardToken:${boardId}`)
            }
            return res.status(Status.OK).json(successResponse(Status.OK, 'Share link revoked'))
        } catch (err) {
            return next(err)
        }
    }

    updateMemberRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { boardId, userId } = req.params
        const { roleName } = req.body
        if (!boardId || !userId || !roleName) {
            return next(errorResponse(Status.BAD_REQUEST, 'boardId, userId and roleName are required'))
        }
        try {
            const isMember = await BoardRepository.findMemberByUserId(boardId, userId)
            if (!isMember) {
                return next(errorResponse(Status.NOT_FOUND, 'User is not a member of the board'))
            }
            const newRole = await roleRepo.findOne({ where: { name: roleName } })
            if (!newRole) {
                return next(errorResponse(Status.NOT_FOUND, 'Role not found'))
            }
            await BoardRepository.updateMemberRole(boardId, userId, roleName)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Member role updated successfully'))
        } catch (err) {
            return next(err)
        }
    }

    changeOwner = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const boardId = req.params.boardId
            const currentOwnerId = req.user!.id
            const newOwnerId = req.body.userId

            if (!boardId || !newOwnerId) {
                return next(errorResponse(Status.BAD_REQUEST, 'BoardId and userId are required'))
            }

            const board = await BoardRepository.getBoardById(boardId)
            if (!board) {
                return next(errorResponse(Status.NOT_FOUND, 'Board not found'))
            }

            await BoardRepository.changeOwner(boardId, currentOwnerId, newOwnerId)

            // Publish board owner changed event for activity logging
            const event: DomainEvent = {
                eventId: crypto.randomUUID(),
                type: EventType.BOARD_OWNER_CHANGED,
                boardId: boardId,
                actorId: currentOwnerId,
                payload: { title: board.title, newOwnerId }
            }
            EventBus.publish(event)

            return res.status(Status.OK).json(successResponse(Status.OK, 'Successfully changed board owner'))
        } catch (err: any) {
            return next(errorResponse(Status.BAD_REQUEST, err.message))
        }
    }

    async removeMember(req: AuthRequest, res: Response, next: NextFunction) {
        const { boardId, userId } = req.params
        try {
            const isMember = await BoardRepository.findMemberByUserId(boardId, userId)
            if (!isMember) {
                return next(errorResponse(Status.NOT_FOUND, 'User is not a member of the board'))
            }

            if (isMember.role.name === 'board_admin') {
                const owners = await BoardRepository.countOwners(boardId)
                if (owners <= 1) {
                    return next(
                        errorResponse(Status.FORBIDDEN, 'Cannot remove the last owner. Transfer ownership first.')
                    )
                }
            }

            await BoardRepository.removeMember(boardId, userId)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Member removed successfully'))
        } catch (err) {
            return next(err)
        }
    }

    leaveBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const boardId = req.params.boardId
            const userId = req.user!.id

            const isMember = await BoardRepository.findMemberByUserId(boardId, userId)
            if (!isMember) {
                return next(errorResponse(Status.NOT_FOUND, 'You are not a member of the board'))
            }

            if (isMember.role.name === 'board_admin') {
                const owners = await BoardRepository.countOwners(boardId)
                if (owners <= 1) {
                    return next(
                        errorResponse(
                            Status.FORBIDDEN,
                            'Cannot leave the board as the last owner. Transfer ownership first.'
                        )
                    )
                }
            }

            await BoardRepository.removeMember(boardId, userId)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Left board successfully'))
        } catch (err) {
            return next(err)
        }
    }
    getPublicBoards = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await boardService.getPublicBoards()
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err) {
            next(err)
        }
    }

    getAllBoards = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user || !req.user.id) {
                return next(errorResponse(Status.UNAUTHORIZED, 'User information not found'))
            }
            const userId = req.user.id

            const result = await boardService.getAllBoards(userId)
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err) {
            next(err)
        }
    }

    getArchivedBoards = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user || !req.user.id) {
                return next(errorResponse(Status.UNAUTHORIZED, 'User information not found'))
            }
            const userId = req.user.id
            const boards = await BoardRepository.getArchivedBoardsForUser(userId)
            return res
                .status(Status.OK)
                .json(successResponse(Status.OK, 'Archived boards fetched successfully', boards))
        } catch (err) {
            next(err)
        }
    }
    getBoardById = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user || !req.user.id) {
                return next(errorResponse(Status.UNAUTHORIZED, 'User information not found'))
            }
            const userId = req.user.id

            const { id } = req.params
            const result = await boardService.getBoardById(id, userId)
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message))
        }
    }

    createBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user || !req.user.id) {
                return next(errorResponse(Status.UNAUTHORIZED, 'User information not found'))
            }
            const userId = req.user.id
            const data: CreateBoardDto = req.body
            const workspaceMemberRepo = AppDataSource.getRepository(WorkspaceMembers)
            const member = await workspaceMemberRepo.findOne({
                where: { workspace: { id: data.workspaceId }, user: { id: userId } },
                relations: ['role', 'role.permissions']
            })

            if (!member) {
                return next(errorResponse(Status.FORBIDDEN, 'You are not a member of this workspace'))
            }

            const hasPermission = member.role.permissions.some((p) => p.name === Permissions.CREATE_BOARD)
            if (!hasPermission) {
                return next(
                    errorResponse(Status.FORBIDDEN, 'You do not have permission to create board in this workspace')
                )
            }
            const result = await boardService.createBoard(data, userId)
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err: any) {
            next(errorResponse(err.status || Status.BAD_REQUEST, err.message))
        }
    }

    getAllMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { boardId } = req.params
            const members = await BoardRepository.findMemberByBoardId(boardId)
            const result = members.map((m) => ({
                userId: m.user.id,
                username: m.user.username,
                email: m.user.email,
                avatarUrl: m.user.avatarUrl,
                role: m.role.name || 'member',
                fullName: m.user.fullName
            }))

            return res.json(successResponse(Status.OK, 'Get board members successfully', result))
        } catch (err) {
            next(err)
        }
    }

    getAllTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const templates = await BoardRepository.findTemplates()

            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Templates fetched successfully',
                data: templates
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to get templates', err))
        }
    }

    createBoardTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) {
                return next(errorResponse(Status.UNAUTHORIZED, 'User not authenticated'))
            }

            const userId = req.user.id
            const { boardId } = req.params

            const board = await boardRepo.findOne({
                where: { id: boardId, isArchived: false },
                relations: {
                    lists: {
                        cards: true
                    }
                }
            })

            if (!board) {
                return next(errorResponse(Status.NOT_FOUND, 'Board not found'))
            }

            let templateBoard!: Board
            let savedLists: List[] = []

            await AppDataSource.transaction(async (manager) => {
                templateBoard = await manager.save(
                    manager.create(Board, {
                        title: board.title,
                        description: board.description,
                        permissionLevel: board.permissionLevel,
                        backgroundPath: board.backgroundPath,
                        backgroundPublicId: board.backgroundPublicId,
                        owner: { id: userId },
                        isTemplate: true
                    })
                )

                const listsToCreate = board.lists.map((list) =>
                    manager.create(List, {
                        title: list.title,
                        position: list.position,
                        board: templateBoard,
                        createdBy: { id: userId }
                    })
                )

                savedLists = await manager.save(listsToCreate)

                // Map old list IDs to newly created lists
                const listMap = new Map<string, List>()
                board.lists.forEach((oldList, index) => {
                    listMap.set(oldList.id, savedLists[index])
                })

                const cardsToCreate = board.lists.flatMap(
                    (list) =>
                        list.cards?.map((card) =>
                            manager.create(Card, {
                                title: card.title,
                                description: card.description,
                                position: card.position,
                                priority: card.priority,
                                dueDate: card.dueDate,
                                list: listMap.get(list.id)!,
                                createdBy: { id: userId }
                            })
                        ) ?? []
                )

                if (cardsToCreate.length > 0) {
                    await manager.save(cardsToCreate)
                }
            })

            // Publish board template created event for activity logging
            const event: DomainEvent = {
                eventId: crypto.randomUUID(),
                type: EventType.BOARD_CREATED,
                boardId: templateBoard.id,
                actorId: userId,
                payload: { title: templateBoard.title, isTemplate: true }
            }
            EventBus.publish(event)

            return res.status(Status.CREATED).json(
                successResponse(Status.CREATED, 'Board template created from board successfully', {
                    id: templateBoard.id,
                    title: templateBoard.title,
                    isTemplate: true
                })
            )
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to create board template', err))
        }
    }

    createBoardFromTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { title, workspaceId } = req.body
            const { templateId } = req.params
            const copyCard = req.query.copyCard === '1'
            const userId = req.user!.id

            const template = await BoardRepository.findTemplateById(templateId, copyCard)
            if (!template) return next(errorResponse(Status.NOT_FOUND, 'Template not found'))

            const workspace = await workspaceRepo.findOne({ where: { id: workspaceId } })
            if (!workspace) return next(errorResponse(Status.NOT_FOUND, 'Workspace not found'))

            const [boardAdminRole] = await Promise.all([roleRepo.findOne({ where: { name: 'board_admin' } })])

            if (!boardAdminRole) {
                return next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Role not found'))
            }

            let savedBoard: Board
            let savedLists: List[] = []
            let savedCards: Card[] = []

            await AppDataSource.transaction(async (manager) => {
                savedBoard = await manager.save(
                    manager.create(Board, {
                        title,
                        description: template.description,
                        permissionLevel: template.permissionLevel,
                        backgroundPath: template.backgroundPath,
                        backgroundPublicId: template.backgroundPublicId,
                        owner: { id: userId },
                        workspace: { id: workspaceId },
                        isTemplate: false
                    })
                )

                const listsToCreate = template.lists.map((list) =>
                    manager.create(List, {
                        title: list.title,
                        position: list.position,
                        board: savedBoard,
                        createdBy: { id: userId }
                    })
                )
                savedLists = await manager.save(listsToCreate)

                const listMap = new Map<string, List>()
                template.lists.forEach((oldList, index) => {
                    listMap.set(oldList.id, savedLists[index])
                })

                if (copyCard) {
                    const cardsToCreate = template.lists.flatMap(
                        (list) =>
                            list.cards?.map((card) =>
                                manager.create(Card, {
                                    title: card.title,
                                    description: card.description,
                                    position: card.position,
                                    priority: card.priority,
                                    dueDate: card.dueDate,
                                    list: listMap.get(list.id)!
                                })
                            ) ?? []
                    )

                    savedCards = await manager.save(cardsToCreate)
                }

                await manager.save(
                    manager.create(BoardMembers, {
                        board: savedBoard,
                        user: { id: userId },
                        role: boardAdminRole
                    })
                )
            })

            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Board created from template successfully',
                data: {
                    id: savedBoard!.id,
                    title: savedBoard!.title,
                    description: savedBoard!.description,
                    permissionLevel: savedBoard!.permissionLevel,
                    isArchived: savedBoard!.isArchived,
                    isTemplate: savedBoard!.isTemplate,
                    backgroundPath: savedBoard!.backgroundPath,
                    backgroundPublicId: savedBoard!.backgroundPublicId,
                    ownerId: userId,
                    workspaceId,
                    createdAt: savedBoard!.createdAt,
                    updatedAt: savedBoard!.updatedAt
                }
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to create board from template', err))
        }
    }

    getAllListOnBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { boardId } = req.params
            const lists = await boardRepository.getAllListsOnBoard(boardId)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Lists fetched successfully', lists))
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to get lists on board', err))
        }
    }
}

export default new BoardController()
