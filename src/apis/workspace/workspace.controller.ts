import { NextFunction, Request, Response } from 'express'
import { Workspace } from '@/entities/workspace.entity'
import { errorResponse, successResponse } from '@/utils/response'
import { Status } from '@/types/response'
import { WorkspaceRepository } from './workspace.repository'
import { AuthRequest } from '@/types/auth-request'
import { Roles } from '@/enums/roles.enum'
import { User } from '@/entities/user.entity'
import UserRepository from '../users/user.repository'

const repo = new WorkspaceRepository()

class WorkspaceController {

    getAllUserWorkspaces = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.UNAUTHORIZED, 'Authentication required'))
            }

            const data = await repo.findAllByUserId(user.id)

            return res.status(Status.OK).json(successResponse(Status.OK, 'Get all user workspaces', data))
        }
        catch (err) {
            next(err)
        }
    }

    getWorkspaceByID = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.UNAUTHORIZED, 'Authentication required'))
            }
            const workspace = await repo.findWithMembersById(req.params.id)

            if (!workspace) {
                return res.status(Status.NOT_FOUND).json(errorResponse(Status.NOT_FOUND, 'Workspace not found'))
            }
            const data = {
                id: workspace.id,
                title: workspace.title,
                description: workspace.description,
                members: workspace.workspaceMembers.map((wm) => ({
                    id: wm.user.id,
                    username: wm.user.username,
                    role: wm.role.name
                }))
            }
            return res.status(Status.OK).json(successResponse(Status.OK, 'Get workspace by ID', data))
        } catch (err) {
            next(err)
        }
    }

    createWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.UNAUTHORIZED, 'Authentication required'))
            }
            const createdWorkspace = await repo.createWorkspace(req.body, user.id)
            await repo.addMemberToWorkspace(user.id, createdWorkspace.id, Roles.WORKSPACE_ADMIN, 'accepted')
            return res
                .status(Status.CREATED)
                .json(successResponse(Status.CREATED, 'Created workspace', createdWorkspace))
        } catch (err) {
            next(err)
        }
    }

    updateWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const data = await repo.updateWorkspace(req.params.id, req.body)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Updated workspace', data))
        } catch (err) {
            next(err)
        }
    }

    deleteWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.UNAUTHORIZED, 'Authentication required'))
            }
            await repo.deleteWorkspace(req.params.id)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Deleted workspace'))
        } catch (err) {
            next(err)
        }
    }


    archiveWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.UNAUTHORIZED, 'Authentication required'))
            }
            const workspaceId: string = req.params.workspaceId
            await repo.archiveWorkspace(workspaceId)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Archived workspace'))
        } catch (err) {
            next(err)
        }
    }

    reopenWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.UNAUTHORIZED, 'Authentication required'))
            }
            const workspaceId: string = req.params.workspaceId
            await repo.reopenWorkspace(workspaceId)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Reopened workspace'))
        } catch (err) {
            next(err)
        }
    }

    addMemberToWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const workspaceId: string = req.params.workspaceId
            const { email } = req.body

            const workspace: Workspace | null = await repo.findWithMembersById(workspaceId)
            if (!workspace) {
                return res.status(Status.NOT_FOUND).json(errorResponse(Status.NOT_FOUND, 'Workspace not found'))
            }
            const user: User | null = await UserRepository.findByEmailAsync(email)
            if (!user) {
                return res.status(Status.NOT_FOUND).json(errorResponse(Status.NOT_FOUND, 'User not found'))
            }
            const isMember = workspace.workspaceMembers.some((wm) => wm.user.id === user.id)
            if (isMember) {
                return res
                    .status(Status.BAD_REQUEST)
                    .json(errorResponse(Status.BAD_REQUEST, 'User is already a member of the workspace'))
            }

            await repo.addMemberToWorkspace(user.id, workspaceId, Roles.WORKSPACE_MEMBER)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Added member to workspace'))
        } catch (err) {
            next(err)
        }
    }

    removeMemberFromWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.UNAUTHORIZED, 'Authentication required'))
            }
            const workspaceId: string = req.params.workspaceId
            const { email } = req.body
            const member: User | null = await UserRepository.findByEmailAsync(email)
            if (!member) {
                return res.status(Status.NOT_FOUND).json(errorResponse(Status.NOT_FOUND, 'User not found'))
            }

            await repo.removeMemberFromWorkspace(member.id, workspaceId)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Removed member from workspace'))
        } catch (err) {
            next(err)
        }
    }

    getWorkspaceMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.UNAUTHORIZED, 'Authentication required'))
            }
            console.log(req.params.workspaceId)
            const workspace = await repo.findWithMembersById(req.params.workspaceId)
            console.log(workspace)
            if (!workspace) {
                return res.status(Status.NOT_FOUND).json(errorResponse(Status.NOT_FOUND, 'Workspace not found'))
            }

            const members = workspace.workspaceMembers.map((wm) => {
                return {
                    id: wm.user.id,
                    username: wm.user.username,
                    role: wm.role.name
                }
            })
            return res.status(Status.OK).json(successResponse(Status.OK, 'Get workspace members', members))
        } catch (err) {
            next(err)
        }
    }

    changeMemberRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { memberId, workspaceId, roleId } = req.body
            await repo.changeMemberRole(memberId, workspaceId, roleId)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Changed member role'))
        } catch (err) {
            next(err)
        }
    }

    getAllInvitations = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.UNAUTHORIZED, 'Authentication required'))
            }
            const invitations = await repo.findAllInvitationsForUser(user.id)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Get all invitations for user', invitations))
        } catch (err) {
            next(err)
        }
    }

    respondToInvitation = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.UNAUTHORIZED, 'Authentication required'))
            }
            const { status } = req.body
            const workspaceId = req.params.workspaceId
            const invitations = await repo.findAllInvitationsForUser(user.id)
            const invitation = invitations.find((inv) => {
                return inv.workspace.id === workspaceId
            })
            if (!invitation) {
                return res.status(Status.NOT_FOUND).json(errorResponse(Status.NOT_FOUND, 'Invitation not found'))
            }
            invitation.status = status
            await repo.updateInvitationStatus(invitation)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Responded to invitation'))
        } catch (err) {
            next(err)
        }
    }

    getAllBoardsInWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.UNAUTHORIZED, 'Authentication required'))
            }
            const workspaceId = req.params.workspaceId
            const boards = await repo.getBoardsInWorkspace(workspaceId)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Get all boards in workspace', boards))
        } catch (err) {
            next(err)
        }
    }
}

export default new WorkspaceController()
