const router = require('express').Router()
const ctrl   = require('../controllers/ordenesCompra.controller')
const { authMiddleware, authorizeRole } = require('../middleware/auth.middleware')

router.use(authMiddleware, authorizeRole('ADMIN'))

router.get('/',                   ctrl.getOrdenes)
router.get('/:id',                ctrl.getOrden)
router.post('/',                  ctrl.createOrden)
router.put('/:id/recibir',        ctrl.recibirOrden)

module.exports = router
