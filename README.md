# Ferretería Ernesto's — SIGI

Sistema de Gestión e Inventario para Ferretería Ernesto's. E-commerce completo con panel de administración, gestión de productos, categorías, ventas, pedidos y más.

## Stack

- **Frontend:** React 19 + Vite + React Router v6 + CSS personalizado
- **Backend:** Node.js + Express + JWT
- **Base de datos:** PostgreSQL + Prisma ORM

---

## Requisitos previos

- Node.js 18+
- PostgreSQL instalado y corriendo
- Git

---

## Instalación

### 1. Clonar el repositorio (rama desarrollo)

```bash
git clone -b desarrollo https://github.com/Jonathan214-blip/ferreteria-ernestos-sigi.git
cd ferreteria-ernestos-sigi
```

### 2. Instalar dependencias del frontend

```bash
npm install
```

### 3. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 4. Crear la base de datos

```bash
createdb -U postgres ferreteria_db
```

### 5. Configurar variables de entorno del backend

Crea el archivo `backend/.env` con el siguiente contenido:

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/ferreteria_db"
JWT_SECRET="clave_secreta_segura"
PORT=3000
```

> Reemplaza `TU_PASSWORD` con la contraseña de tu usuario de PostgreSQL.

### 6. Correr las migraciones

```bash
cd backend
npx prisma migrate deploy
```

---

## Levantar el proyecto

Abre **dos terminales**:

**Terminal 1 — Backend:**
```bash
cd ferreteria-ernestos-sigi/backend
npm run dev
# Corre en http://localhost:3000
```

**Terminal 2 — Frontend:**
```bash
cd ferreteria-ernestos-sigi
npm run dev
# Corre en http://localhost:5173
```

---

## Crear usuario administrador

Una vez levantado el backend, regístrate desde la app en `/registro` y luego cambia el rol en la base de datos:

```sql
UPDATE "Usuario" SET rol = 'ADMIN' WHERE email = 'tu@email.com';
```

O usando psql:
```bash
psql -U postgres -d ferreteria_db -c "UPDATE \"Usuario\" SET rol = 'ADMIN' WHERE email = 'tu@email.com';"
```

---

## Estructura del proyecto

```
ferreteria-ernestos-sigi/
├── src/                  # Frontend React
│   ├── components/       # Componentes (admin, ui, layout, operador)
│   ├── pages/            # Páginas
│   ├── context/          # AuthContext, CartContext
│   └── services/         # api.js (llamadas al backend)
├── backend/              # API Node.js + Express
│   ├── src/
│   │   ├── routes/       # Rutas de la API
│   │   ├── controllers/  # Controladores
│   │   └── middleware/   # Auth, roles
│   └── prisma/           # Schema y migraciones
└── public/
```

---

## Roles de usuario

| Rol | Acceso |
|-----|--------|
| `ADMIN` | Panel completo: productos, categorías, usuarios, ventas, reportes |
| `OPERADOR` | Gestión de productos e inventario |
| `CLIENTE` | Tienda, carrito, wishlist, pedidos |
