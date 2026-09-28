const prisma = require('../utils/prisma')
const { ok, err } = require('../utils/response')

async function getCategorias(req, res) {
  const cats = await prisma.categoria.findMany({
    orderBy: { nombre: 'asc' },
    include: { _count: { select: { productos: true } } }
  })
  return ok(res, cats)
}

async function getCategoria(req, res) {
  const cat = await prisma.categoria.findUnique({ where: { id: Number(req.params.id) } })
  if (!cat) return err(res, 'Categoría no encontrada', 404)
  return ok(res, cat)
}

async function createCategoria(req, res) {
  const { nombre, descripcion, imagen, icono } = req.body
  if (!nombre) return err(res, 'Nombre requerido')
  const cat = await prisma.categoria.create({ data: { nombre, descripcion, imagen, icono } })
  return ok(res, cat, 201)
}

async function updateCategoria(req, res) {
  const { nombre, descripcion, imagen, icono, activa } = req.body
  const cat = await prisma.categoria.update({
    where: { id: Number(req.params.id) },
    data: { nombre, descripcion, imagen, icono, activa }
  })
  return ok(res, cat)
}

async function deleteCategoria(req, res) {
  await prisma.categoria.delete({ where: { id: Number(req.params.id) } })
  return ok(res, { id: Number(req.params.id) })
}

module.exports = { getCategorias, getCategoria, createCategoria, updateCategoria, deleteCategoria }
