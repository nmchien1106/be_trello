import 'dotenv/config'
import 'reflect-metadata'
import AppDataSource from '@/config/typeorm.config'
import express, { urlencoded } from 'express'
import { ErrorHandler } from './middleware/error-handle'
import AppRoute from './apis/index'
import cors from 'cors'
import passport from 'passport'
import { Config } from './config/config'
import session from 'express-session'
import './config/passport.config'
import { openAPIRouter } from '@/api-docs/openApiRouter'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { ActivitySubscriber } from './apis/activity/activity.subscriber'
import { Activity } from './entities/activity.entity'
import { ActivityRepository } from './apis/activity/activity.repository'
import { NotificationSubscriber } from './apis/notification/notification.subscriber'

// Create Express app

const app = express()
const PORT = Number(process.env.PORT || 3000)

let activitySubscriber: ActivitySubscriber | null = null
let notificationSubscriber: NotificationSubscriber | null = null

AppDataSource.initialize()
    .then(async () => {
        console.log('Data Source has been initialized!')

        // Setup Activity Subscriber
        const activityRepo = new ActivityRepository(AppDataSource.getRepository(Activity))
        activitySubscriber = new ActivitySubscriber(activityRepo)
        await activitySubscriber.init()
        console.log('Activity subscriber registered')

        // Setup Notification Subscriber
        notificationSubscriber = new NotificationSubscriber()
        await notificationSubscriber.init()
        console.log('Notification subscriber registered')
    })
    .catch((err) => {
        console.error('Error during Data Source initialization or subscriber setup:', err)
    })

app.use(morgan('dev')) // Logging middleware

// cors
app.use(
    cors({
        origin: Config.corsOrigin,
        credentials: true
    })
)

app.use(express.json()) // Parse JSON request bodies
app.use(urlencoded({ extended: true })) // Parse URL-encoded request bodies

// Session and Passport
app.use(
    session({
        secret: Config.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: Config.cookieMaxAge }
    })
)

app.use(passport.initialize())
app.use(passport.session())

app.use(cookieParser()) // Parse cookies

app.use(openAPIRouter) // OpenAPI routes

app.use('/api', AppRoute) // API routes

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        msg: 'NOT FOUND'
    })
})
// Error Handler
app.use(ErrorHandler)

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
