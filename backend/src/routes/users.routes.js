const router = require('express').Router()
const ctrl   = require('../controllers/users.controller')
const { authMiddleware, authorizeRole } = require('../middleware/auth.middleware')

router.use(authMiddleware)

router.get('/roles', ctrl.getRoles)
router.get('/',      authorizeRole('ADMIN'), ctrl.getUsuarios)
router.get('/:id',   ctrl.getUsuario)
router.delete('/:id', authorizeRole('ADMIN'), ctrl.deleteUsuario)

module.exports = router
