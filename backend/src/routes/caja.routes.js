const router = require('express').Router()
const ctrl   = require('../controllers/caja.controller')
const { authMiddleware, authorizeRole } = require('../middleware/auth.middleware')

router.use(authMiddleware, authorizeRole('ADMIN', 'OPERADOR'))

router.get('/estado',    ctrl.getEstado)
router.get('/historial', ctrl.getHistorial)
router.post('/abrir',    ctrl.abrirCaja)
router.put('/cerrar',    ctrl.cerrarCaja)

module.exports = router
