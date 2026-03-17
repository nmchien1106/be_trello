import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { SeedTemplates } from './templates.seeder'
import AppDataSource from '../config/typeorm.config'

async function runSeeder() {
    try {
        const dataSource: DataSource = await AppDataSource.initialize()
        const seeder = new SeedTemplates(dataSource)

        await seeder.init()
        console.log('🌱 Template Seeding completed successfully!')
        await dataSource.destroy()
    } catch (error) {
        console.error('❌ Template Seeding failed:', error)
        process.exit(1)
    }
}

runSeeder()
