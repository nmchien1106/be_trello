import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// Request schemas
export const CreateWorkspaceRequestSchema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().optional()
}).openapi({
    description: 'Create workspace request',
    example: { 
        title: 'My Workspace', 
        description: 'Workspace description' 
    }
});

export const UpdateWorkspaceRequestSchema = z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().optional()
}).openapi({
    description: 'Update workspace request',
    example: {
        title: 'Updated Workspace',
        description: 'Updated description'
    }
});

export const WorkspaceSchema = CreateWorkspaceRequestSchema; // For validation in routes

export const AddWorkspaceMemberRequestSchema = z.object({
    email: z.string().email()
}).openapi({
    description: 'Add workspace member by email',
    example: { email: 'user@example.com' }
});

export const RemoveMemberRequestSchema = z.object({
    email: z.string().email()
}).openapi({
    description: 'Remove member by email',
    example: { email: 'user@example.com' }
});

export const ChangeMemberRoleRequestSchema = z.object({
    memberId: z.string().uuid(),
    workspaceId: z.string().uuid(),
    roleId: z.string().uuid()
}).openapi({
    description: 'Change member role',
    example: {
        memberId: 'user-uuid',
        workspaceId: 'workspace-uuid',
        roleId: 'role-uuid'
    }
});

export const InvitationResponseSchema = z.object({
    status: z.enum(['accepted', 'rejected'])
}).openapi({
    description: 'Respond to workspace invitation',
    example: { status: 'accepted' }
});

// Response schemas
export const WorkspaceResponseSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().optional(),
    isArchived: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string()
}).openapi({
    description: 'Workspace response',
    example: {
        id: 'cc7a10e2-df5e-4974-8a5c-df541cdc2a17',
        title: 'My Workspace',
        description: 'Workspace description',
        isArchived: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
    }
});

export const WorkspaceMemberSchema = z.object({
    id: z.string().uuid(),
    username: z.string(),
    role: z.string()
}).openapi({
    description: 'Workspace member',
    example: {
        id: 'user-uuid',
        username: 'john_doe',
        role: 'workspace_member'
    }
});

export const WorkspaceDetailResponseSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().optional(),
    members: z.array(WorkspaceMemberSchema)
}).openapi({
    description: 'Workspace detail with members',
    example: {
        id: 'workspace-uuid',
        title: 'My Workspace',
        description: 'Description',
        members: [
            {
                id: 'user-uuid',
                username: 'john_doe',
                role: 'workspace_admin'
            }
        ]
    }
});

export const InvitationSchema = z.object({
    id: z.string().uuid(),
    workspace: z.object({
        id: z.string().uuid(),
        title: z.string(),
        description: z.string().optional()
    }),
    role: z.object({
        name: z.string()
    }),
    status: z.enum(['accepted', 'rejected', 'pending']),
    createdAt: z.string(),
    updatedAt: z.string()
}).openapi({
    description: 'Workspace invitation',
    example: {
        id: 'invitation-uuid',
        workspace: {
            id: 'workspace-uuid',
            title: 'Team Workspace',
            description: 'Join our team'
        },
        role: {
            name: 'workspace_member'
        },
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
    }
});

export const ShareLinkResponseSchema = z.object({
  link: z.string().url()
}).openapi({
  description: 'Workspace share link',
  example: {
    link: 'https://example.com/api/workspaces/join?token=abc123'
  }
})

export const JoinWorkspaceQuerySchema = z.object({
  token: z.string().uuid()
}).openapi({
  description: 'Join workspace by invite or share link token',
  example: {
    token: 'cc7a10e2-df5e-4974-8a5c-df541cdc2a17'
  }
})

export const RevokeShareLinkQuerySchema = z.object({
  token: z.string().uuid()
}).openapi({
  description: 'Revoke workspace share link',
  example: {
    token: 'cc7a10e2-df5e-4974-8a5c-df541cdc2a17'
  }
})
