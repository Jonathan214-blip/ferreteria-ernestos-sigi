const router = require('express').Router()
const ctrl   = require('../controllers/pedidos.controller')
const { authMiddleware, authorizeRole } = require('../middleware/auth.middleware')

router.use(authMiddleware)

router.get('/mis-pedidos',      ctrl.getMisPedidos)
router.get('/',                 authorizeRole('ADMIN', 'OPERADOR'), ctrl.getPedidos)
router.get('/:id',              ctrl.getPedido)
router.post('/',                ctrl.createPedido)
router.patch('/:id/estado',     authorizeRole('ADMIN', 'OPERADOR'), ctrl.actualizarEstado)
router.patch('/:id/confirmar',  authorizeRole('ADMIN', 'OPERADOR'), ctrl.confirmar)
router.patch('/:id/cancelar',   ctrl.cancelar)

module.exports = router
