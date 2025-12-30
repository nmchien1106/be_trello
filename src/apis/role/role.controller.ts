import roleRepository from './role.repository'
import { RoleDTO, RoleDTOForRelation } from './role.dto'
import { Request, Response, NextFunction } from 'express'
import { Status } from '@/types/response'
import { successResponse } from '@/utils/response'
import { PermissionDTO, PermissionDTOForRelation } from './../permission/permission.dto'

class RoleController {
    getAllRoles = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const roles = await roleRepository.getAllRoles()
            return res.status(Status.OK).json(successResponse(Status.OK, 'Roles fetched successfully', roles))
        } catch (err) {
            next(err)
        }
    }

    getRoleById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params
            const role = await roleRepository.getRoleById(id)
            if (!role) {
                return res.status(Status.NOT_FOUND).json(successResponse(Status.NOT_FOUND, 'Role not found'))
            }
            const roleDTO = new RoleDTO(role)
            roleDTO.permissions= role.permissions.map((permission) => {
                return new PermissionDTOForRelation(permission.id, permission.name)
            })
            return res.status(Status.OK).json(successResponse(Status.OK, 'Role fetched successfully', roleDTO))
        } catch (err) {
            next(err)
        }
    }

    getRoleByName = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name } = req.params
            const role = await roleRepository.getRoleByName(name)
            if (!role) {
                return res.status(Status.NOT_FOUND).json(successResponse(Status.NOT_FOUND, 'Role not found'))
            }
            const roleDTO = new RoleDTO(role)
            roleDTO.permissions= role.permissions.map((permission) => {
                return new PermissionDTOForRelation(permission.id, permission.name)
            })
            return res.status(Status.OK).json(successResponse(Status.OK, 'Role fetched successfully', roleDTO))
        } catch (err) {
            next(err)
        }
    }
}

export default new RoleController()
