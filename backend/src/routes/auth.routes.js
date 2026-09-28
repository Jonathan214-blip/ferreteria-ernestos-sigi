const router = require('express').Router()
const ctrl   = require('../controllers/auth.controller')
const { authMiddleware } = require('../middleware/auth.middleware')

router.post('/login',             ctrl.login)
router.post('/register',          ctrl.register)
router.post('/register-cliente',  ctrl.registerCliente)
router.get('/me',   authMiddleware, ctrl.me)
router.put('/perfil', authMiddleware, ctrl.updatePerfil)

module.exports = router
