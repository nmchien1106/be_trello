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
import userRepository from '../users/user.repository'
import { BoardService } from './board.service'
import { CreateBoardDto } from './board.dto'
import { WorkspaceMembers } from '@/entities/workspace-member.entity'
import { Permissions } from '@/enums/permissions.enum'
import { Auth } from 'typeorm'


const roleRepo = AppDataSource.getRepository(Role)
const boardService = new BoardService()

class BoardController {
    // PATCH /api/boards/:boardId
    // update a field on board
    // allow updating only specific fields (title, description, permissionLevel) => solve in middleware
    updateBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { boardId } = req.params
            const data = req.body

            const updatedBoard = await BoardRepository.updateBoard(boardId, data)
            if (!updatedBoard) {
                return next(errorResponse(Status.NOT_FOUND, 'Board not found'))
            }
            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Board updated successfully',
                data: updatedBoard
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to update board field', err))
        }
    }

    // Post /api/boards/:boardId/archive
    archiveBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { boardId } = req.params
            const board = await BoardRepository.getBoardById(boardId)
            if (!board) {
                return next(errorResponse(Status.NOT_FOUND, 'Board not found'))
            }
            if (board.isArchived) {
                return next(errorResponse(Status.BAD_REQUEST, 'Board is already archived'))
            }
            const updatedBoard = await BoardRepository.updateBoard(boardId, { isArchived: true })
            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Board archived successfully'
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to archive board', err))
        }
    }

    // Post /api/boards/:boardId/reopen
    reopenBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { boardId } = req.params
            const board = await BoardRepository.getBoardById(boardId)
            if (!board) {
                return next(errorResponse(Status.NOT_FOUND, 'Board not found'))
            }
            if (!board.isArchived) {
                return next(errorResponse(Status.BAD_REQUEST, 'Board is not archived'))
            }
            const updatedBoard = await BoardRepository.updateBoard(boardId, { isArchived: false })
            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Board reopened successfully'
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to reopen board', err))
        }
    }

    // DELETE /api/boards/:boardId --> Delete perrmanently
    deleteBoardPerrmanently = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { boardId } = req.params
            await BoardRepository.deleteBoard(boardId)
            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Board deleted permanently'
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to delete board', err))
        }
    }

    // POST /api/boards/:boardId/background
    uploadBoardBackground = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { boardId } = req.params
            if (!req.file) {
                return next(errorResponse(Status.BAD_REQUEST, 'No file uploaded'))
            }

            const { path, filename } = req.file as any
            console.log(req.file)
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
        const { email } = req.body
        const boardId = req.params.boardId

        if (!email) {
            return next(errorResponse(Status.BAD_REQUEST, 'Email is required'))
        }

        if (email === req.user!.email) {
            return next(errorResponse(Status.BAD_REQUEST, 'Cannot invite yourself'))
        }

        try {
            const user = await userRepository.findByEmailAsync(email)
            if (!user) {
                return res.status(Status.FORBIDDEN).json(errorResponse(Status.FORBIDDEN, 'User not found'))
            }
            const isMember = await BoardRepository.findMemberByEmail(boardId, email)
            if (isMember) {
                return res.status(Status.FORBIDDEN).json(errorResponse(Status.FORBIDDEN, 'Already a member'))
            }

            const token = await this.sendInvitationEmail(boardId, email)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Invitation sent successfully', { token }))
        } catch (err) {
            return next(err)
        }
    }

    sendInvitationEmail = async (boardId: string, email: string) => {
        const token = crypto.randomUUID()

        await redisClient.setEx(`invite:${token}`, 7 * 24 * 60 * 60, JSON.stringify({ boardId, email }))

        const inviteLink = `${Config.baseUrl}/api/boards/join?token=${token}`
        const mailOptions = {
            from: Config.emailUser,
            to: email,
            subject: 'Invitation to join board',
            html: `
                <p>You have been invited to join a board.</p>
                <a href="${inviteLink}">Accept Invitation</a>
            `
        }

        await emailTransporter.sendMail(mailOptions)
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

            const { boardId } = JSON.parse(dataStr)

            const userId = req.user!.id

            const isMember = await BoardRepository.findMemberByUserId(boardId, userId)
            if (isMember) {
                return res.status(Status.OK).json(successResponse(Status.OK, 'Already a member of the board'))
            }

            await BoardRepository.addMemberToBoard(boardId, userId, 'board_member')

            if (type === 'invite') {
                await redisClient.del(`invite:${token}`)
            }

            return res.status(Status.OK).json(successResponse(Status.OK, 'Successfully joined the board'))
        } catch (err) {
            next(err)
        }
    }

    async createShareLink(req: AuthRequest, res: Response, next: NextFunction) {
        const user = req.user
        if (!user) {
            return next(errorResponse(Status.NOT_FOUND, 'User not found'))
        }
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

        const token = crypto.randomUUID()

        const payload = {
            boardId
        }

        await redisClient.setEx(`shareLink:${token}`, 7 * 24 * 60 * 60, JSON.stringify(payload))

        const link = `${Config.baseUrl}/api/boards/join?token=${token}`
        return res.status(Status.OK).json(successResponse(Status.OK, 'Share link created', { link }))
    }

    revokeShareLink = async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { token } = req.query
        await redisClient.del(`shareLink:${token}`)
        return res.status(Status.OK).json(successResponse(Status.OK, 'Share link revoked'))
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
            const { id } = req.params
            const members = await BoardRepository.findMemberByBoardId(id)

            const result = members.map((m) => ({
                userId: m.user.id,
                fullName: m.user.username,
                email: m.user.email,
                avatar: m.user.avatarUrl,
                role: m.role.name || 'member'
            }))

            return res.json(successResponse(Status.OK, 'Get board members successfully', result))
        } catch (err) {
            next(err)
        }
    }

    getAllTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            console.log("Get All Template")

            const templates = await BoardRepository.findTemplates();

            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Templates fetched successfully',
                data: templates
            });
        } catch (err) {
            console.error("ERROR GET TEMPLATE: ", err); 
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to get templates', err));
        }
    }


    getTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const template = await BoardRepository.getTemplateDetail(id);

            if (!template) {
                return next(errorResponse(Status.NOT_FOUND, 'Template not found'));
            }

            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Template fetched successfully',
                data: template
            });
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to get template', err));
        }
    }
}

export default new BoardController()
