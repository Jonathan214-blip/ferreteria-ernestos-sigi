/**
 * Helpers para respuestas consistentes con el frontend (parseResponse.js)
 * { ok, data, total?, page?, limit? }
 */

function ok(res, data, status = 200) {
  return res.status(status).json({ ok: true, data })
}

function paginated(res, data, total, page, limit) {
  return res.json({ ok: true, data, total, page: Number(page), limit: Number(limit) })
}

function err(res, message, status = 400) {
  return res.status(status).json({ ok: false, message })
}

module.exports = { ok, paginated, err }
