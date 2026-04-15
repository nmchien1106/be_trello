import BoardRepository from './board.repository'
import { EventBus } from '@/events/event-bus'
import { DomainEvent } from '@/events/interface'
import { EventType } from '@/enums/event-type.enum'
import crypto from 'crypto'
import { CreateBoardDto } from './board.dto'
import { Status } from '@/types/response'
import cloudinary from '@/config/cloundinary'

export class BoardService {
    async getPublicBoards() {
        const boards = await BoardRepository.getPublicBoards()
        return {
            status: Status.OK,
            message: 'Public boards retrieved successfully',
            data: boards
        }
    }

    async getAllBoards(userId: string) {
        const boards = await BoardRepository.getAllBoardsForUser(userId)
        console.log(boards)
        return {
            status: Status.OK,
            message: 'Boards retrieved successfully',
            data: boards
        }
    }

    async getBoardById(boardId: string, userId: string) {
        try {
            const board = await BoardRepository.getBoardDetail(boardId, userId)
            if (!board) throw new Error('Board not found')
            return {
                status: Status.OK,
                message: 'Board retrieved successfully',
                data: board
            }
        } catch (error: any) {
            if (error.message === 'Permission denied') {
                throw { status: Status.FORBIDDEN, message: 'You do not have permission to access this board' }
            }
            throw { status: Status.NOT_FOUND, message: 'Board not found' }
        }
    }

    async createBoard(data: CreateBoardDto, userId: string) {
        try {
            const { workspaceId, ...boardData } = data
            const board = await BoardRepository.createBoard(
                {
                    ...boardData,
                    backgroundPath: data.backgroundUrl
                },
                workspaceId,
                userId
            )

            const formatted = {
                id: board.id,
                title: board.title,
                description: board.description,
                permissionLevel: board.permissionLevel,
                workspaceId: board.workspaceId,
                createdAt: board.createdAt,
                updatedAt: board.updatedAt
            }
            const existing = await BoardRepository.findMemberByUserId(board.id, userId)
            if (!existing) {
                await BoardRepository.addMemberToBoard(board.id, userId, 'board_admin')
            }

            // publish board created event for activity logging
            const event: DomainEvent = {
                eventId: crypto.randomUUID(),
                type: EventType.BOARD_CREATED,
                boardId: board.id,
                actorId: userId,
                payload: { title: board.title, description: board.description }
            }
            EventBus.publish(event)

            return {
                status: Status.CREATED,
                message: 'Board created successfully',
                data: formatted
            }
        } catch (error: any) {
            throw { status: Status.BAD_REQUEST, message: error.message }
        }
    }

    async uploadBoardBackground(boardId: string, file: Express.Multer.File) {
        const board = await BoardRepository.getBoardById(boardId)
        if (!board) throw { status: Status.NOT_FOUND, message: 'Board not found' }

        if (!file?.buffer) {
            throw { status: Status.BAD_REQUEST, message: 'Invalid file upload' }
        }

        const uploadResult = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject({ status: Status.GATEWAY_TIMEOUT, message: 'Board background upload timed out' })
            }, 30000)

            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'boards',
                    public_id: `board_${boardId}_background`,
                    resource_type: 'image',
                    transformation: [{ width: 1500, height: 500, crop: 'limit' }]
                },
                (error, result) => {
                    clearTimeout(timeout)
                    if (error) {
                        return reject(error)
                    }
                    resolve(result)
                }
            )

            stream.end(file.buffer)
        })

        const backgroundUrl = uploadResult.secure_url || uploadResult.url
        if (!backgroundUrl) {
            throw { status: Status.INTERNAL_SERVER_ERROR, message: 'Failed to upload board background' }
        }

        return BoardRepository.updateBoard(boardId, {
            backgroundPath: backgroundUrl,
            backgroundPublicId: uploadResult.public_id || `board_${boardId}_background`
        })
    }
}
