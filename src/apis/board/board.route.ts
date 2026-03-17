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

// Get All Lists on Board
route.get(
    '/:boardId/lists',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.UPDATE_BOARD),
    boardController.getAllListOnBoard
)

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
    authorizePermissionWorkspace(Permissions.UPDATE_WORKSPACE),
    validateHandle(CreateBoardSchema),
    boardController.createBoard
)

// Get All Boards
route.get('/', verifyAccessToken, boardController.getAllBoards)

// Get Archived Boards for current user
route.get('/archived', verifyAccessToken, boardController.getArchivedBoards)

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
    authorizeBoardPermission(Permissions.ADD_MEMBER_TO_BOARD),
    boardController.createShareLink
)

// Revoke Share Link
route.delete(
    '/:boardId/share-link',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.REVOKE_LINK),
    boardController.revokeShareLink
)

// Change Owner
route.patch(
    '/:boardId/change-owner',
    verifyAccessToken,
    authorizeBoardPermission(Permissions.UPDATE_BOARD_MEMBER_ROLE),
    boardController.changeOwner
)

// Get Board Detail
route.get(
    '/:boardId',
    verifyAccessToken,
    // authorizeBoardPermission(Permissions.READ_BOARD),
    boardController.getBoardById
)

// Get Members
route.get(
    '/:boardId/members',
    verifyAccessToken,
    // authorizeBoardPermission(Permissions.READ_BOARD),
    boardController.getAllMembers
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
route.post('/:boardId/archive', verifyAccessToken, boardController.archiveBoard)

// Reopen
route.post('/:boardId/reopen', verifyAccessToken, boardController.reopenBoard)

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

export default route
