import { Request } from 'express'
import type {} from 'multer'


export interface AuthRequest extends Request {
    user?: {
        id: string
        [key: string]: any
    },
    file?: {
        fieldname: string
        originalname: string
        encoding: string
        mimetype: string
        size: number
        destination: string
        filename: string
    }
}

export interface AuthenticatedRequest extends Request {
    user: {
        id: string
        [key: string]: any
    }
    workspacePermissions?: {
        role: string | null
        permissions: string[]
        isMember: boolean
    }
}
