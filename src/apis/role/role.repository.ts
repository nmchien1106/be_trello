import AppDataSource from '@/config/typeorm.config'
import { Role } from '@/entities/role.entity'
import { Repository } from 'typeorm'

class RoleRepository {
    private RoleRepository: Repository<Role> = AppDataSource.getRepository(Role)

    getAllRoles = async () => {
        return await this.RoleRepository.find()
    }

    getRoleById = async (id: string) => {
        return await this.RoleRepository.findOne({ where: { id }, relations: ['permissions'] })
    }

    getRoleByName = async (name: string) => {
        return await this.RoleRepository.findOne({ where: { name }, relations : ['permissions'] })
    }
}

export default new RoleRepository()
