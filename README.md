# Serena Glow — Frontend

Sitio web de e-commerce para marca femenina de cosméticos, perfumes, body care y trajes de baño.

## Stack

- **React 18 + Vite 5** — Frontend framework
- **Bootstrap 5.3** — Grid y utilidades base
- **CSS Modules** — Estilos modulares con variables globales
- **Firebase** — Auth, Firestore, Cloud Storage, App Check
- **React Router v6** — Enrutamiento SPA
- **Vercel** — Deploy del frontend
- **pnpm** — Package manager

---

## Requisitos previos

- Node.js ≥ 18
- pnpm ≥ 9 (`npm install -g pnpm`)
- Proyecto Firebase configurado (Firestore, Storage, Auth, App Check)

---

## Setup inicial

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

Copiá `.env.example` a `.env.local` y completá con tus credenciales de Firebase:

```bash
cp .env.example .env.local
```

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_RECAPTCHA_SITE_KEY=...
VITE_WHATSAPP_NUMBER=5491100000000
```

### 3. Correr en desarrollo

```bash
pnpm dev
```

---

## Configurar Firebase

### Crear admin user con custom claim

En Firebase Console → Functions o via Admin SDK en un script local:

```js
// scripts/setAdminClaim.js  (ejecutar UNA vez con service account)
const admin = require('firebase-admin')
admin.initializeApp()
admin.auth().setCustomUserClaims('UID_DEL_USUARIO', { role: 'admin' })
```

> ⚠️ **Nunca** incluir service accounts en el frontend ni en el repositorio.

### Deployar Security Rules

```bash
firebase deploy --only firestore:rules,storage
```

### Deployar Firestore indexes

```bash
firebase deploy --only firestore:indexes
```

---

## Estructura de carpetas

```
src/
├── app/                  # Shell, Router, Providers globales
│   ├── providers/
│   └── Router.jsx
├── home/                 # Feature: página de inicio
│   ├── components/
│   │   ├── Hero/
│   │   ├── CategoryGrid/
│   │   ├── FeaturedProducts/
│   │   ├── EmotionalBanner/
│   │   └── InstagramGallery/
│   ├── hooks/
│   └── HomePage.jsx
├── catalog/              # Feature: catálogo y detalle de producto
│   ├── components/
│   ├── hooks/
│   ├── CatalogPage.jsx
│   └── ProductPage.jsx
├── contact/              # Feature: contacto
│   └── ContactPage.jsx
├── backoffice/           # Feature: panel de administración
│   ├── auth/
│   ├── dashboard/
│   ├── products/
│   ├── categories/
│   ├── banners/
│   ├── gallery/
│   ├── messages/
│   ├── settings/
│   └── shared/
├── shared/               # Componentes, hooks y utils reutilizables
│   ├── components/
│   │   ├── Navbar/
│   │   ├── Footer/
│   │   ├── WhatsAppButton/
│   │   ├── ui/
│   │   └── PublicLayout.jsx
│   └── utils/
├── firebase/             # Inicialización de servicios Firebase
└── styles/               # CSS global y variables
```

---

## Colecciones Firestore

| Colección    | Descripción                                 |
|--------------|---------------------------------------------|
| `products`   | Catálogo de productos                       |
| `categories` | Categorías de productos                     |
| `banners`    | Banners del hero y emocional (`hero`, `emotional`) |
| `gallery`    | Imágenes de galería tipo Instagram          |
| `messages`   | Mensajes del formulario de contacto         |
| `siteConfig` | Configuración global del sitio (`main`)     |

---

## Deploy en Vercel

```bash
# Desde Vercel Dashboard o CLI
vercel --prod
```

Variables de entorno: configurarlas en Vercel Dashboard → Settings → Environment Variables.

---

## Backoffice

Acceso en `/admin/login`. Requiere usuario con `role: 'admin'` o `role: 'editor'` (custom claim de Firebase Auth).

**Funcionalidades:**
- Dashboard con estadísticas
- CRUD completo de Productos (con imagen, categoría, atributos, badge, orden)
- CRUD de Categorías (con imagen, slug auto-generado, protección anti-borrado si tiene productos)
- Edición de Banners (hero y emocional, con imagen de fondo)
- Galería tipo Instagram (agregar/editar/eliminar, con limpieza de Storage)
- Mensajes de contacto (lectura, marcar leído, eliminar)
- Configuración del sitio (marca, contacto, redes sociales, textos)

> Las imágenes se eliminan del Storage automáticamente al eliminar el documento correspondiente (sin imágenes huérfanas).
