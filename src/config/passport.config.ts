import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Config } from '../config/config'
import UserRepository from '@/apis/users/user.repository'

passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID: Config.googleClientID,
      clientSecret: Config.googleClientSecret,
      callbackURL: Config.googleRedirectURI,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await UserRepository.findUserBy({ googleID: profile.id })
        const email = profile.emails?.[0]?.value

        if (!user) {
          const existingUser = await UserRepository.findByEmailAsync(email)
          if (!existingUser) {
            user = await UserRepository.createUser({
              googleID: profile.id,
              email,
              avatarUrl: profile.photos?.[0]?.value,
              username: profile.displayName,
              isActive: true,
            })
          } else {
            user = existingUser
            user.googleID = profile.id
            await UserRepository.updateUser(user.id, user)
          }
        }

        return done(null, user)
      } catch (err) {
        return done(err)
      }
    }
  )
)

passport.serializeUser((user: any, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserRepository.findById(id)
    done(null, user)
  } catch (err) {
    done(err, null)
  }
})

export default passport
