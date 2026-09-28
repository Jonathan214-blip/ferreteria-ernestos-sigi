const router = require('express').Router()
const ctrl   = require('../controllers/categorias.controller')
const { authMiddleware, authorizeRole } = require('../middleware/auth.middleware')

router.get('/',    ctrl.getCategorias)
router.get('/:id', ctrl.getCategoria)

router.post('/',    authMiddleware, authorizeRole('ADMIN'), ctrl.createCategoria)
router.put('/:id',  authMiddleware, authorizeRole('ADMIN'), ctrl.updateCategoria)
router.delete('/:id', authMiddleware, authorizeRole('ADMIN'), ctrl.deleteCategoria)

module.exports = router
