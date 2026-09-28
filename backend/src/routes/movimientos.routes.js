const router = require('express').Router()
const ctrl   = require('../controllers/movimientos.controller')
const { authMiddleware, authorizeRole } = require('../middleware/auth.middleware')

router.use(authMiddleware, authorizeRole('ADMIN', 'OPERADOR'))

router.get('/',   ctrl.getMovimientos)
router.post('/',  ctrl.createMovimiento)

module.exports = router
