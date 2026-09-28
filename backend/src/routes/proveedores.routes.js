const router = require('express').Router()
const ctrl   = require('../controllers/proveedores.controller')
const { authMiddleware, authorizeRole } = require('../middleware/auth.middleware')

router.use(authMiddleware, authorizeRole('ADMIN'))

router.get('/',     ctrl.getProveedores)
router.get('/:id',  ctrl.getProveedor)
router.post('/',    ctrl.createProveedor)
router.put('/:id',  ctrl.updateProveedor)
router.delete('/:id', ctrl.deleteProveedor)

module.exports = router
