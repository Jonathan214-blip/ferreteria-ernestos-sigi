const prisma = require('../utils/prisma')
const { ok, err } = require('../utils/response')

async function getEstado(req, res) {
  const caja = await prisma.caja.findFirst({
    where: { usuario_id: req.user.id, estado: 'ABIERTA' },
    orderBy: { abierta_at: 'desc' }
  })
  return ok(res, caja)
}

async function getHistorial(req, res) {
  const cajas = await prisma.caja.findMany({
    where: { usuario_id: req.user.id },
    orderBy: { abierta_at: 'desc' },
    take: 30
  })
  return ok(res, cajas)
}

async function abrirCaja(req, res) {
  const abierta = await prisma.caja.findFirst({
    where: { usuario_id: req.user.id, estado: 'ABIERTA' }
  })
  if (abierta) return err(res, 'Ya tienes una caja abierta')

  const { monto_apertura } = req.body
  if (monto_apertura == null) return err(res, 'Monto de apertura requerido')

  const caja = await prisma.caja.create({
    data: { usuario_id: req.user.id, monto_apertura: Number(monto_apertura) }
  })
  return ok(res, caja, 201)
}

async function cerrarCaja(req, res) {
  const caja = await prisma.caja.findFirst({
    where: { usuario_id: req.user.id, estado: 'ABIERTA' }
  })
  if (!caja) return err(res, 'No tienes una caja abierta')

  const monto_cierre = Number(caja.monto_apertura) + Number(caja.total_ventas)
  const c = await prisma.caja.update({
    where: { id: caja.id },
    data: { estado: 'CERRADA', monto_cierre, cerrada_at: new Date() }
  })
  return ok(res, c)
}

module.exports = { getEstado, getHistorial, abrirCaja, cerrarCaja }
