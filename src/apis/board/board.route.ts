import { boardsRegisterPath } from './board.swagger'
import boardController from './board.controller'
import { BoardUpload } from '@/middleware/upload'
import { Router } from 'express'
import { verifyAccessToken } from '@/utils/jwt'
import { validateHandle } from '@/middleware/validate-handle'
import { checkBoardPermission, checkWorkspacePermission } from '@/middleware/authorization'
import {
    CreateBoardSchema,
    inviteByEmailSchema,
    acceptInviteSchema,
    joinViaShareLinkSchema,
    revokeShareLinkSchema,
    UpdateBoardRequest,
    CreateTemplateSchema
} from './board.schema'
import { PERMISSIONS } from '@/enums/permissions.enum'

const route = Router()

boardsRegisterPath()

// Get all starred boards
route.get('/starred', verifyAccessToken, boardController.getStarredBoards)

// Get Public Boards
route.get('/public', boardController.getPublicBoards)

//Get Template
route.get('/template', verifyAccessToken, boardController.getAllTemplates)

route.post('/seed-templates', verifyAccessToken, boardController.seedTemplates)

route.get('/join', verifyAccessToken, boardController.joinBoard)

// Create Board
route.post(
    '/',
    verifyAccessToken,
    checkWorkspacePermission(PERMISSIONS.CREATE_BOARD),
    validateHandle(CreateBoardSchema),
    boardController.createBoard
)

// Get All Boards
route.get('/', verifyAccessToken, boardController.getAllBoards)

// Get Archived Boards for current user
route.get('/archived', verifyAccessToken, boardController.getArchivedBoards)

// Get All Lists on Board
route.get(
    '/:boardId/lists',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.READ_BOARD),
    boardController.getAllListOnBoard
)

// Get Archived Lists in a Board
route.get(
    '/:boardId/archived/lists',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.READ_BOARD),
    boardController.getArchivedListsInBoard
)

// Get Archived Cards in a Board
route.get(
    '/:boardId/archived/cards',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.READ_BOARD),
    boardController.getArchivedCardsInBoard
)

// Invite via email
route.post(
    '/:boardId/invite/email',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.ADD_MEMBER_TO_BOARD),
    validateHandle(inviteByEmailSchema),
    boardController.inviteByEmail.bind(boardController)
)

// Generate Share Link
route.post(
    '/:boardId/invite/link',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.ADD_MEMBER_TO_BOARD),
    boardController.createShareLink
)

// Revoke Share Link
route.delete(
    '/:boardId/share-link',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.REVOKE_LINK),
    boardController.revokeShareLink
)

// Change Owner
route.patch(
    '/:boardId/change-owner',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.UPDATE_BOARD),
    boardController.changeOwner
)

// Get Board Detail
route.get('/:boardId', verifyAccessToken, checkBoardPermission(PERMISSIONS.READ_BOARD), boardController.getBoardById)

// Get Members
route.get(
    '/:boardId/members',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.READ_BOARD_MEMBERS),
    boardController.getAllMembers
)

// Update Member Role
route.patch(
    '/:boardId/members/:userId/role',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.UPDATE_BOARD_MEMBER_ROLE),
    boardController.updateMemberRole
)

// Remove Member
route.delete(
    '/:boardId/members/:userId',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.REMOVE_MEMBER_FROM_BOARD),
    boardController.removeMember
)

// Update Board Info
route.patch(
    '/:boardId',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.UPDATE_BOARD),
    validateHandle(UpdateBoardRequest),
    boardController.updateBoard
)

// Archive
route.post(
    '/:boardId/archive',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.UPDATE_BOARD),
    boardController.archiveBoard
)

// Reopen
route.post(
    '/:boardId/reopen',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.UPDATE_BOARD),
    boardController.reopenBoard
)

// Upload Background
route.post(
    '/:boardId/background',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.UPDATE_BOARD),
    BoardUpload.single('background'),
    boardController.uploadBoardBackground
)

// Delete Permanently
route.delete(
    '/:boardId',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.DELETE_BOARD),
    boardController.deleteBoardPerrmanently
)

// Leave Board
route.post(
    '/:boardId/leave',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.READ_BOARD),
    boardController.leaveBoard
)

//Create board from template
route.post(
    '/template/:templateId',
    verifyAccessToken,
    checkWorkspacePermission(PERMISSIONS.CREATE_BOARD),
    boardController.createBoardFromTemplate
)

//Create Template
route.post(
    '/:boardId/template',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.UPDATE_BOARD),
    boardController.createBoardTemplate
)

// Star / Unstar a board
route.post(
    '/:boardId/star',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.READ_BOARD),
    boardController.toggleStarBoard
)

export default route
