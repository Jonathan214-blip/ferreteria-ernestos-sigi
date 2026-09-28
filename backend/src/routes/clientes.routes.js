const router = require('express').Router()
const ctrl   = require('../controllers/clientes.controller')
const { authMiddleware, authorizeRole } = require('../middleware/auth.middleware')

router.use(authMiddleware)

router.get('/',     authorizeRole('ADMIN', 'OPERADOR'), ctrl.getClientes)
router.get('/:id',  authorizeRole('ADMIN', 'OPERADOR'), ctrl.getCliente)
router.post('/',    authorizeRole('ADMIN'), ctrl.createCliente)
router.put('/:id',  authorizeRole('ADMIN'), ctrl.updateCliente)
router.delete('/:id', authorizeRole('ADMIN'), ctrl.deleteCliente)

module.exports = router
