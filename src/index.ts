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

// Create Express app

const app = express()
const PORT = 3000

app.use(morgan('dev')) // Logging middleware

// cors
app.use(
    cors({
        origin: 'http://localhost:5173',
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

// Connect database
AppDataSource.initialize()
    .then(() => {
        console.log('Data Source has been initialized!')
    })
    .catch((err) => {
        console.error('Error during Data Source initialization:', err)
    })

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
    console.log(`Server running on http://localhost:${PORT}`)
})
