const router = require('express').Router()
const { ok } = require('../utils/response')
const { authMiddleware, authorizeRole } = require('../middleware/auth.middleware')

// Estado simulado en memoria
let waStatus = { connected: false, qr: null }

router.use(authMiddleware, authorizeRole('ADMIN'))

// GET /api/whatsapp/status
router.get('/status', (_req, res) => {
  return ok(res, {
    connected: waStatus.connected,
    estado: waStatus.connected ? 'conectado' : 'desconectado',
    mensaje: 'WhatsApp simulado (modo desarrollo)'
  })
})

// GET /api/whatsapp/qr
router.get('/qr', (_req, res) => {
  // QR simulado como data URL de 1x1 pixel transparente
  const fakeQr = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  return ok(res, { qr: fakeQr, expira_en: 60 })
})

// POST /api/whatsapp/qr/regenerar
router.post('/qr/regenerar', (_req, res) => {
  return ok(res, { mensaje: 'QR regenerado (simulado)' })
})

module.exports = router
