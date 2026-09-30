import { useState, useEffect } from 'react'
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '../../services/api'
import { toArr } from '../../utils/parseResponse'
import Modal from './shared/Modal'
import * as Icons from './shared/Icons'

const emptyForm = { nombre: '', descripcion: '', imagen: '' }

// Imagen de portada por nombre de categoría (fallback visual)
const CAT_IMAGES = {
  'Herramientas Eléctricas': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&q=80',
  'Herramientas Manuales':   'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400&q=80',
  'Pinturas':                'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80',
  'Construcción':            'https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80',
  'Eléctrico':               'https://images.unsplash.com/photo-1558618047-f4e4b3fd5b21?w=400&q=80',
  'Seguridad':               'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80',
  'Plomería':                'https://images.unsplash.com/photo-1584792686745-55b6de1d4c40?w=400&q=80',
  'Medición':                'https://images.unsplash.com/photo-1601055903647-ddf1ee9701b7?w=400&q=80',
  'Herramientas':            'https://images.unsplash.com/photo-1518709414768-a88981a4515d?w=400&q=80',
  'Eléctrica':               'https://images.unsplash.com/photo-1558618047-f4e4b3fd5b21?w=400&q=80',
  'Fontanería':              'https://images.unsplash.com/photo-1584792686745-55b6de1d4c40?w=400&q=80',
  'Pintura':                 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80',
  'Medición y Trazado':      'https://images.unsplash.com/photo-1601055903647-ddf1ee9701b7?w=400&q=80',
}

function getCatImage(nombre) {
  if (!nombre) return null
  // exact match first, then partial
  if (CAT_IMAGES[nombre]) return CAT_IMAGES[nombre]
  const key = Object.keys(CAT_IMAGES).find(k => nombre.toLowerCase().includes(k.toLowerCase()))
  return key ? CAT_IMAGES[key] : null
}

function AdminCategorias() {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editItem, setEditItem]     = useState(null)
  const [form, setForm]             = useState(emptyForm)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)

  useEffect(() => {
    getCategorias()
      .then(r => setCategorias(toArr(r.data).map(c => ({ ...c, activo: c.activo ?? true }))))
      .catch(() => setError('Error al cargar categorías'))
      .finally(() => setLoading(false))
  }, [])

  function handleEdit(cat) {
    setEditItem(cat)
    setForm({ nombre: cat.nombre || '', descripcion: cat.descripcion || '', imagen: cat.imagen || '' })
    setShowForm(true)
  }

  async function handleDelete(id) {
    if (!confirm('¿Desactivar esta categoría?')) return
    try {
      await deleteCategoria(id)
      setCategorias(prev => prev.map(c => c.id === id ? { ...c, activo: false } : c))
    } catch { alert('No se pudo desactivar') }
  }

  async function handleReactivar(cat) {
    try {
      const { data } = await updateCategoria(cat.id, { nombre: cat.nombre, descripcion: cat.descripcion, activo: true })
      setCategorias(prev => prev.map(c => c.id === cat.id ? { ...(data?.data || data), activo: true } : c))
    } catch { alert('No se pudo reactivar') }
  }

  async function handleSubmit() {
    if (!form.nombre.trim()) return setError('El nombre es requerido')
    setSaving(true); setError(null)
    try {
      if (editItem) {
        const { data } = await updateCategoria(editItem.id, form)
        setCategorias(prev => prev.map(c => c.id === editItem.id ? { ...(data?.data || data), activo: true } : c))
      } else {
        const { data } = await createCategoria(form)
        setCategorias(prev => [...prev, { ...(data?.data || data), activo: true }])
      }
      setShowForm(false); setEditItem(null); setForm(emptyForm)
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al guardar'
      const yaExiste = msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('duplicad')
      setError(yaExiste
        ? `${msg}. Si fue desactivada, búscala abajo y usa "Reactivar".`
        : msg)
    } finally { setSaving(false) }
  }

  const activas   = categorias.filter(c => c.activo !== false)
  const inactivas = categorias.filter(c => c.activo === false)

  return (
    <div>
      {/* Barra superior */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--subtle)' }}>
            <strong style={{ color: 'var(--fg)' }}>{activas.length}</strong> activas
            {inactivas.length > 0 && <> · <strong style={{ color: '#888' }}>{inactivas.length}</strong> inactivas</>}
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setEditItem(null); setForm(emptyForm); setError(null) }}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
          + Nueva categoría
        </button>
      </div>

      {/* Grid de cards activas */}
      {loading ? (
        <div style={gridStyle}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ borderRadius: '12px', height: '200px', background: '#f0f0f0', animation: 'pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      ) : activas.length === 0 ? (
        <p style={{ color: 'var(--subtle)', padding: '2rem' }}>No hay categorías activas.</p>
      ) : (
        <div style={gridStyle}>
          {activas.map(cat => (
            <CatCard key={cat.id} cat={cat} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Inactivas */}
      {inactivas.length > 0 && (
        <>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '1.5rem 0 0.75rem' }}>Categorías inactivas</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {inactivas.map(cat => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#f5f5f5', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.875rem', opacity: 0.75 }}>
                <span style={{ fontSize: '0.875rem', color: '#888', textDecoration: 'line-through' }}>{cat.nombre}</span>
                <button onClick={() => handleReactivar(cat)}
                  style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2E7D32', background: '#e8f5e9', border: 'none', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>
                  Reactivar
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {showForm && (
        <Modal onClose={() => { setShowForm(false); setError(null) }} maxWidth="440px">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '1.5rem' }}>
            {editItem ? 'Editar categoría' : 'Nueva categoría'}
          </h3>
          {error && <p style={{ color: '#c62828', marginBottom: '1rem', fontSize: '0.875rem', background: '#ffebee', padding: '0.6rem', borderRadius: '6px' }}>{error}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[{ label: 'Nombre *', key: 'nombre' }, { label: 'Descripción', key: 'descripcion' }, { label: 'URL de imagen', key: 'imagen' }].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: 'var(--muted-fg)' }}>{f.label}</label>
                <input type="text" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.key === 'imagen' ? 'https://...' : ''}
                  style={{ width: '100%', padding: '0.65rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            {form.imagen && (
              <div style={{ borderRadius: '8px', overflow: 'hidden', height: '100px' }}>
                <img src={form.imagen} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => e.target.style.display = 'none'} />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={handleSubmit} disabled={saving}
              style={{ flex: 1, background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Guardando...' : editItem ? 'Guardar' : 'Crear'}
            </button>
            <button onClick={() => { setShowForm(false); setError(null) }}
              style={{ flex: 1, background: 'var(--secondary)', color: 'var(--fg)', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '1.25rem',
  marginBottom: '1rem',
}

function CatCard({ cat, onEdit, onDelete }) {
  const img = cat.imagen || getCatImage(cat.nombre)

  return (
    <div style={{
      background: '#fff', borderRadius: '12px', border: '1.5px solid var(--border)',
      overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none' }}
    >
      {/* Imagen de cabecera */}
      <div style={{ position: 'relative', height: '110px', overflow: 'hidden', background: '#1a1a2e' }}>
        {img
          ? <img src={img} alt={cat.nombre} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}><Icons.Wrench size={40} /></div>
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
        <span style={{
          position: 'absolute', bottom: '8px', left: '10px',
          fontSize: '0.9rem', fontWeight: 700, color: '#fff',
          textShadow: '0 1px 4px rgba(0,0,0,0.5)',
        }}>{cat.nombre}</span>
        <span style={{
          position: 'absolute', top: '8px', right: '8px',
          fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '20px',
          background: '#e8f5e9', color: '#2E7D32',
        }}>Activa</span>
      </div>

      {/* Descripción + acciones */}
      <div style={{ padding: '0.75rem' }}>
        {cat.descripcion && (
          <p style={{ fontSize: '0.78rem', color: 'var(--subtle)', marginBottom: '0.75rem', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {cat.descripcion}
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => onEdit(cat)}
            style={{ flex: 1, padding: '0.4rem 0', borderRadius: '7px', fontSize: '0.75rem', fontWeight: 700,
              cursor: 'pointer', border: '1.5px solid var(--accent)', color: 'var(--accent)', background: 'transparent',
              transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)' }}
          ><span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.3rem' }}><Icons.Edit size={13} /> Editar</span></button>
          <button onClick={() => onDelete(cat.id)}
            style={{ flex: 1, padding: '0.4rem 0', borderRadius: '7px', fontSize: '0.75rem', fontWeight: 700,
              cursor: 'pointer', border: '1.5px solid #c62828', color: '#c62828', background: 'transparent',
              transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#c62828'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c62828' }}
          ><span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.3rem' }}><Icons.Trash2 size={13} /> Desactivar</span></button>
        </div>
      </div>
    </div>
  )
}

export default AdminCategorias
