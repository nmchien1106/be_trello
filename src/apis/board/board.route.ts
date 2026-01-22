import { boardsRegisterPath } from './board.swagger'
import boardController from './board.controller'
import { BoardUpload } from '@/middleware/upload'
import { Router } from 'express'
import { verifyAccessToken } from '@/utils/jwt'
import { validateHandle } from '@/middleware/validate-handle'
import { authorizeBoardPermission, authorizePermissionWorkspace } from '@/middleware/authorization'
import { Permissions } from './../../enums/permissions.enum'
import {
    CreateBoardSchema,
    inviteByEmailSchema,
    acceptInviteSchema,
    joinViaShareLinkSchema,
    revokeShareLinkSchema,
    UpdateBoardRequest,
    CreateTemplateSchema
} from './board.schema'

const route = Router()

boardsRegisterPath()

// Get Public Boards
route.get('/public', boardController.getPublicBoards)

//Get Template
route.get('/template', verifyAccessToken, boardController.getAllTemplates)

route.get('/join', verifyAccessToken, validateHandle(acceptInviteSchema), boardController.joinBoard)

route.delete(
    '/revoke-link',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.REVOKE_LINK),
    boardController.revokeShareLink
)

// Create Board & Get All Boards
route.post(
    '/',
    verifyAccessToken,
    authorizePermissionWorkspace(Permissions.UPDATE_WORKSPACE),
    validateHandle(CreateBoardSchema),
    boardController.createBoard
)

route.get('/', verifyAccessToken, boardController.getAllBoards)

// Invite via email
route.post(
    '/:boardId/invite/email',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.ADD_MEMBER_TO_BOARD),
    validateHandle(inviteByEmailSchema),
    boardController.inviteByEmail.bind(boardController)
)

// Generate Share Link
route.post(
    '/:boardId/invite/link',
    verifyAccessToken,
    // authorizeBoardPermission(Permissions.ADD_MEMBER_TO_BOARD),
    boardController.createShareLink
)

// Change Owner
route.patch(
    '/:boardId/change-owner',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.UPDATE_BOARD_MEMBER_ROLE),
    boardController.changeOwner
)

// Update Member Role
route.patch(
    '/:boardId/members/:userId/role',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.UPDATE_BOARD_MEMBER_ROLE),
    boardController.updateMemberRole
)

// Remove Member
route.delete(
    '/:boardId/members/:userId',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.REMOVE_MEMBER_FROM_BOARD),
    boardController.removeMember
)

// Update Board Info
route.patch(
    '/:boardId',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.UPDATE_BOARD),
    validateHandle(UpdateBoardRequest),
    boardController.updateBoard
)

// Archive
route.post(
    '/:boardId/archive',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.MANAGE_BOARD),
    boardController.archiveBoard
)

// Reopen
route.post(
    '/:boardId/reopen',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.MANAGE_BOARD),
    boardController.reopenBoard
)

// Upload Background
route.post(
    '/:boardId/background',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.UPDATE_BOARD),
    BoardUpload.single('background'),
    boardController.uploadBoardBackground
)

// Delete Permanently
route.delete(
    '/:boardId',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.DELETE_BOARD),
    boardController.deleteBoardPerrmanently
)

// Leave Board
route.post(
    '/:boardId/leave',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.READ_BOARD),
    boardController.leaveBoard
)

// Get Board Detail
route.get('/:id', verifyAccessToken, authorizeBoardPermission(Permissions.READ_BOARD), boardController.getBoardById)

// Get Members
route.get(
    '/:id/members',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.READ_BOARD),
    boardController.getAllMembers
)

//Create board from template
route.post(
    '/template/:templateId',
    verifyAccessToken,
    authorizePermissionWorkspace(Permissions.UPDATE_WORKSPACE),
    boardController.createBoardFromTemplate
)

//Create Template
route.post(
    '/:boardId/template',
    verifyAccessToken,
    // authorizePermissionWorkspace(Permissions.UPDATE_WORKSPACE),
    // validateHandle(CreateTemplateSchema),
    boardController.createBoardTemplate
)

route.get(
    '/:boardId/lists',
    verifyAccessToken,
    // authorizeBoardPermission(Permissions.READ_BOARD),
    boardController.getAllListOnBoard
)

export default route
