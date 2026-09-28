const router = require('express').Router()
const ctrl   = require('../controllers/carrito.controller')

router.get('/',             ctrl.getCarrito)
router.post('/items',       ctrl.addItem)
router.put('/items/:producto_id', ctrl.updateItem)
router.delete('/items/:producto_id', ctrl.removeItem)
router.delete('/',          ctrl.clearCarrito)
router.post('/checkout',    ctrl.checkout)

module.exports = router
