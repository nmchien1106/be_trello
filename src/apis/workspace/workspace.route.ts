import { PERMISSIONS } from '@/enums/permissions.enum'
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
import { checkWorkspacePermission, checkWorkspaceShareLinkPermission } from '@/middleware/authorization'
import { registerPath } from './workspace.swagger'

const router = Router()

registerPath()

// ------------ Routes for workspace management (CRUD, archive/unarchive) -----------
router.route('/archived').get(verifyAccessToken, WorkspaceController.getArchivedWorkspaces)
router.route('/').get(verifyAccessToken, WorkspaceController.getWorkspaces)
router.route('/').post(verifyAccessToken, validateHandle(WorkspaceSchema), WorkspaceController.createWorkspace)

router
    .route('/:workspaceId')
    .delete(
        verifyAccessToken,
        checkWorkspacePermission(PERMISSIONS.DELETE_WORKSPACE),
        WorkspaceController.deleteWorkspace
    )
    .put(
        verifyAccessToken,
        checkWorkspacePermission(PERMISSIONS.UPDATE_WORKSPACE),
        validateHandle(UpdateWorkspaceRequestSchema),
        WorkspaceController.updateWorkspace
    )
    .get(verifyAccessToken, checkWorkspacePermission(PERMISSIONS.READ_WORKSPACE), WorkspaceController.getWorkspaceByID)

router
    .route('/:workspaceId/archive')
    .post(
        verifyAccessToken,
        checkWorkspacePermission(PERMISSIONS.MANAGE_WORKSPACE_PERMISSIONS),
        WorkspaceController.archiveWorkspace
    )

router
    .route('/:workspaceId/unarchive')
    .post(
        verifyAccessToken,
        checkWorkspacePermission(PERMISSIONS.MANAGE_WORKSPACE_PERMISSIONS),
        WorkspaceController.reopenWorkspace
    )

// ---------- Member management routes ----------
router
    .route('/:workspaceId/members')
    .get(
        verifyAccessToken,
        checkWorkspacePermission(PERMISSIONS.READ_WORKSPACE_MEMBERS),
        WorkspaceController.getWorkspaceMembers
    )
    .post(
        verifyAccessToken,
        validateHandle(WorkspaceSchema),
        checkWorkspacePermission(PERMISSIONS.ADD_MEMBER_TO_WORKSPACE),
        WorkspaceController.addMemberToWorkspace
    )
    .delete(
        verifyAccessToken,
        checkWorkspacePermission(PERMISSIONS.REMOVE_MEMBER_FROM_WORKSPACE),
        WorkspaceController.removeMemberFromWorkspace
    )

// ---------- Share link and invitation routes ----------
router.route('/join').get(verifyAccessToken, WorkspaceController.joinWorkspace)

router
    .route('/:workspaceId/invite')
    .post(
        verifyAccessToken,
        checkWorkspacePermission(PERMISSIONS.ADD_MEMBER_TO_WORKSPACE),
        validateHandle(AddWorkspaceMemberRequestSchema),
        WorkspaceController.inviteByEmail
    )

router
    .route('/:workspaceId/share-link')
    .post(
        verifyAccessToken,
        checkWorkspacePermission(PERMISSIONS.MANAGE_WORKSPACE_PERMISSIONS),
        WorkspaceController.createShareLink
    )

router
    .route('/share-link/revoke')
    .post(
        verifyAccessToken,
        checkWorkspaceShareLinkPermission(PERMISSIONS.MANAGE_WORKSPACE_PERMISSIONS),
        WorkspaceController.revokeShareLink
    )

// ---------- Other routes ----------
router
    .route('/:workspaceId/boards')
    .get(
        verifyAccessToken,
        checkWorkspacePermission(PERMISSIONS.READ_WORKSPACE),
        WorkspaceController.getAllBoardsInWorkspace
    )

export default router
