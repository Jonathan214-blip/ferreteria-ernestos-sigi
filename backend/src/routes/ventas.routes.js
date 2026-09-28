const router = require('express').Router()
const ctrl   = require('../controllers/ventas.controller')
const { authMiddleware, authorizeRole } = require('../middleware/auth.middleware')

router.use(authMiddleware, authorizeRole('ADMIN', 'OPERADOR'))

router.get('/',     ctrl.getVentas)
router.get('/:id',  ctrl.getVenta)
router.post('/',    ctrl.createVenta)
router.put('/:id/cancelar', ctrl.cancelarVenta)

module.exports = router
