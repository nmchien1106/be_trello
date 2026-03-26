import { Permissions } from './../../enums/permissions.enum'
import WorkspaceController from './workspace.controller'
import { Router } from 'express'
import { verifyAccessToken } from '@/utils/jwt'
import {
    InvitationResponseSchema,
    WorkspaceSchema,
    AddWorkspaceMemberRequestSchema,
    UpdateWorkspaceRequestSchema
} from './workspace.schema'
import { validateHandle } from '@/middleware/validate-handle'
import { authorizePermissionWorkspace } from '@/middleware/authorization'
import { registerPath } from './workspace.swagger'

const router = Router()

registerPath()

// Get all user workspaces
router.route('/').get(
    verifyAccessToken,
    // authorizePermissionWorkspace(Permissions.READ_WORKSPACE),
    WorkspaceController.getAllUserWorkspaces
)

// Get archived workspaces
router.route('/archived').get(
    verifyAccessToken,
    // authorizePermissionWorkspace(Permissions.READ_WORKSPACE),
    WorkspaceController.getArchivedWorkspaces
)

// Create Workspace
router.route('/').post(
    verifyAccessToken,
    // authorizePermissionWorkspace(Permissions.CREATE_WORKSPACE),
    validateHandle(WorkspaceSchema),
    WorkspaceController.createWorkspace
)

// Workspace Invitations
router.route('/invitations').get(verifyAccessToken, WorkspaceController.getAllInvitations)

// Join workspace via shareable link
router.route('/join').get(verifyAccessToken, WorkspaceController.joinWorkspace)

// Respond to invitation
router
    .route('/invitations/:workspaceId')
    .post(verifyAccessToken, validateHandle(InvitationResponseSchema), WorkspaceController.respondToInvitation)

// Workspace management
router
    .route('/:workspaceId')
    .delete(
        verifyAccessToken,
        authorizePermissionWorkspace(Permissions.DELETE_WORKSPACE),
        WorkspaceController.deleteWorkspace
    )
    .put(
        verifyAccessToken,
        authorizePermissionWorkspace(Permissions.UPDATE_WORKSPACE),
        validateHandle(UpdateWorkspaceRequestSchema),
        WorkspaceController.updateWorkspace
    )
    .get(
        verifyAccessToken,
        authorizePermissionWorkspace(Permissions.READ_WORKSPACE),
        WorkspaceController.getWorkspaceByID
    )

// Archive workspace
router
    .route('/:workspaceId/archive')
    .post(
        verifyAccessToken,
        authorizePermissionWorkspace(Permissions.MANAGE_WORKSPACE_PERMISSIONS),
        WorkspaceController.archiveWorkspace
    )

// Reopen archived workspace
router
    .route('/:workspaceId/unarchive')
    .post(
        verifyAccessToken,
        authorizePermissionWorkspace(Permissions.MANAGE_WORKSPACE_PERMISSIONS),
        WorkspaceController.reopenWorkspace
    )

// Manage workspace members
router
    .route('/:workspaceId/members')
    .get(
        verifyAccessToken,
        authorizePermissionWorkspace(Permissions.READ_WORKSPACE_MEMBERS),
        WorkspaceController.getWorkspaceMembers
    )
    .post(
        verifyAccessToken,
        validateHandle(WorkspaceSchema),
        authorizePermissionWorkspace(Permissions.ADD_MEMBER_TO_WORKSPACE),
        WorkspaceController.addMemberToWorkspace
    )
    .delete(
        verifyAccessToken,
        authorizePermissionWorkspace(Permissions.REMOVE_MEMBER_FROM_WORKSPACE),
        WorkspaceController.removeMemberFromWorkspace
    )

// Get all boards in a workspace
router
    .route('/:workspaceId/boards')
    .get(
        verifyAccessToken,
        authorizePermissionWorkspace(Permissions.READ_WORKSPACE),
        WorkspaceController.getAllBoardsInWorkspace
    )

// Invite by email
router
    .route('/:workspaceId/invite')
    .post(
        verifyAccessToken,
        authorizePermissionWorkspace(Permissions.ADD_MEMBER_TO_WORKSPACE),
        validateHandle(AddWorkspaceMemberRequestSchema),
        WorkspaceController.inviteByEmail
    )

// Generate shareable link
router
    .route('/:workspaceId/share-link')
    .post(
        verifyAccessToken,
        authorizePermissionWorkspace(Permissions.MANAGE_WORKSPACE_PERMISSIONS),
        WorkspaceController.createShareLink
    )

// Revoke shareable link
router
    .route('/share-link/revoke')
    .post(
        verifyAccessToken,
        authorizePermissionWorkspace(Permissions.MANAGE_WORKSPACE_PERMISSIONS),
        WorkspaceController.revokeShareLink
    )
export default router
