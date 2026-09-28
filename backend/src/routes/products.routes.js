const router = require('express').Router()
const ctrl   = require('../controllers/products.controller')
const { authMiddleware, authorizeRole } = require('../middleware/auth.middleware')

// Públicos
router.get('/',        ctrl.getProductos)
router.get('/marcas',  ctrl.getMarcas)
router.get('/:id',     ctrl.getProducto)

// Protegidos
router.post('/',    authMiddleware, authorizeRole('ADMIN'), ctrl.createProducto)
router.put('/:id',  authMiddleware, authorizeRole('ADMIN'), ctrl.updateProducto)
router.delete('/:id', authMiddleware, authorizeRole('ADMIN'), ctrl.deleteProducto)

module.exports = router
