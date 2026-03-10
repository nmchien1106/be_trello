import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { SeedAuthorization } from './authorization.seeder'
import { SeedData } from './data.seeder'
import AppDataSource from '../src/config/typeorm.config'

async function runSeeder() {
    try {
        const dataSource: DataSource = await AppDataSource.initialize()

        console.log('--- Seeding Authorization ---')
        const authSeeder = new SeedAuthorization(dataSource)
        await authSeeder.init()

        console.log('--- Seeding Test Data ---')
        const dataSeeder = new SeedData(dataSource)
        await dataSeeder.init()

        console.log('🌱 Seeding completed successfully!')
        await dataSource.destroy()
    } catch (error) {
        console.error('❌ Seeding failed:', error)
        process.exit(1)
    }
}

runSeeder()
