import { v2 as cloudinary } from 'cloudinary'
import { Config } from './config'

cloudinary.config({
    cloud_name: Config.cloudinaryName,
    api_key: Config.cloudinaryApiKey,
    api_secret: Config.cloudinaryApiSecret
})

export default cloudinary