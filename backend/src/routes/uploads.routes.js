const router  = require('express').Router()
const multer  = require('multer')
const path    = require('path')
const fs      = require('fs')
const { ok, err } = require('../utils/response')
const { authMiddleware, authorizeRole } = require('../middleware/auth.middleware')

const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    cb(null, name)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Solo se permiten imágenes'))
  }
})

router.post('/imagen', authMiddleware, authorizeRole('ADMIN'), upload.single('imagen'), (req, res) => {
  if (!req.file) return err(res, 'No se recibió imagen')
  const url = `${process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`}/uploads/${req.file.filename}`
  return ok(res, { url })
})

module.exports = router
