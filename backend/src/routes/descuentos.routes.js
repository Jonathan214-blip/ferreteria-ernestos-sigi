const router = require('express').Router()
const ctrl   = require('../controllers/descuentos.controller')
const { authMiddleware, authorizeRole } = require('../middleware/auth.middleware')

// Público: verificar primera compra
router.get('/primera-compra/verificar', ctrl.verificarPrimeraCompra)
// Público: listar descuentos activos
router.get('/',    ctrl.getDescuentos)
router.get('/:id', ctrl.getDescuento)

router.use(authMiddleware, authorizeRole('ADMIN'))
router.post('/',    ctrl.createDescuento)
router.put('/:id',  ctrl.updateDescuento)
router.delete('/:id', ctrl.deleteDescuento)

module.exports = router
