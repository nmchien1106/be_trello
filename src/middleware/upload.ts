import multer from 'multer'
import cloudinary from '@/config/cloundinary'
import CloudinaryStorage from 'multer-storage-cloudinary'

export const AvatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true)
        } else {
            cb(new Error('Only .jpg and .png format allowed!'))
        }
    }
})

export const BoardUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true)
        } else {
            cb(new Error('Only .jpg and .png format allowed!'))
        }
    }
})

const AttachmentStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const { id } = req.params
        const timestamp = Date.now()

        return {
            folder: 'attachments',
            public_id: `card_${id}_${timestamp}`,
            resource_type: 'auto'
        }
    }
})

export const AttachmentUpload = multer({
    storage: AttachmentStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        cb(null, true)
    }
})

export const CardBackgroundUpload = multer({
    // Use memory storage and upload in service to avoid hanging requests from CloudinaryStorage middleware.
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('Only .jpg and .png format allowed!'))
        }
    }
})
