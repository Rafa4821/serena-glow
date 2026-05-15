# Firebase Schema — Serena Glow

> Última actualización: mayo 2026  
> Proyecto Firebase: configurado en `.env.local` (`VITE_FIREBASE_PROJECT_ID`)

---

## Arquitectura general

```
src/firebase/
├── config.js          # initializeApp — usa VITE_FIREBASE_* (sin secretos)
├── auth.js            # getAuth(app) singleton
├── firestore.js       # getFirestore(app) singleton
├── storage.js         # getStorage(app) singleton
├── appCheck.js        # reCAPTCHA v3 — VITE_RECAPTCHA_SITE_KEY
├── firebaseClient.js  # barrel export: todos los singletons + servicios
└── services/
    ├── productService.js
    ├── categoryService.js
    ├── bannerService.js
    ├── galleryService.js
    ├── inquiryService.js
    ├── mediaService.js
    └── siteConfigService.js
```

**Regla de importación:** cualquier módulo de la app importa desde `@/firebase/firebaseClient` o del servicio individual. **Nunca** se hacen llamadas directas a Firestore/Storage fuera de `services/`.

---

## Variables de entorno

| Variable | Descripción | ¿Pública? |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | API Key del proyecto | ✅ (protegida por Rules + AppCheck) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de auth | ✅ |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto | ✅ |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de Storage | ✅ |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID de mensajería | ✅ |
| `VITE_FIREBASE_APP_ID` | App ID | ✅ |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics ID | ✅ |
| `VITE_RECAPTCHA_SITE_KEY` | Site key reCAPTCHA v3 | ✅ |
| `VITE_WHATSAPP_NUMBER` | Número WA con código país | ✅ |

> ⚠️ **Nunca** commitear `.env.local`. Solo commitear `.env.example`.  
> Las claves privadas (Admin SDK, service account) viven **únicamente** en el servidor (CI/CD secrets o scripts locales fuera del repo).

---

## Colecciones Firestore

### `products`

Colección principal de productos del catálogo.

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | `string` | Nombre del producto |
| `slug` | `string` | URL amigable única |
| `shortDescription` | `string` | Descripción corta (≤ 160 chars) para cards |
| `description` | `string` | Descripción larga con HTML permitido |
| `price` | `number` | Precio base en ARS |
| `salePrice` | `number \| null` | Precio oferta (null = sin oferta) |
| `currency` | `string` | Símbolo moneda, default `$` |
| `status` | `'published' \| 'draft' \| 'archived'` | Estado de visibilidad |
| `featured` | `boolean` | Aparece en sección destacados (home) |
| `order` | `number` | Orden de aparición (menor = primero) |
| `badge` | `string` | Etiqueta visual (ej: "Nuevo", "Oferta") |
| `tags` | `string[]` | Tags para búsqueda y filtros |
| `stock` | `number \| null` | Stock disponible (null = ilimitado) |
| `categorySlug` | `string` | Referencia a `categories.slug` |
| `categoryName` | `string` | Desnormalizado para display |
| `imageUrl` | `string` | URL imagen principal (Storage) |
| `imagePath` | `string` | Path en Storage para poder borrar |
| `images` | `{ url, path, alt }[]` | Galería adicional de imágenes |
| `attributes` | `{ key, value }[]` | Atributos custom (talla, material…) |
| `createdAt` | `Timestamp` | Auto — serverTimestamp |
| `updatedAt` | `Timestamp` | Auto — serverTimestamp |

**Índices requeridos:**
- `status ASC + order ASC`
- `status ASC + featured ASC + order ASC`
- `status ASC + categorySlug ASC + order ASC`

**Reglas de acceso:**
- Lectura pública: `status == 'published'`
- Escritura: rol `editor` o `admin`

---

### `categories`

Categorías del catálogo.

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | `string` | Nombre visible |
| `slug` | `string` | ID de documento + URL slug |
| `description` | `string` | Descripción de la categoría |
| `imageUrl` | `string` | URL imagen (Storage) |
| `imagePath` | `string` | Path en Storage |
| `active` | `boolean` | Visible en catálogo público |
| `order` | `number` | Orden en la grilla |
| `createdAt` | `Timestamp` | Auto |
| `updatedAt` | `Timestamp` | Auto |

**Índices requeridos:**
- `active ASC + order ASC`

**Reglas:** lectura pública si `active == true`, escritura solo editors.

---

### `banners`

Banners del sitio (hero + emocional).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | Mismo que el doc ID (`hero`, `emotional`) |
| `position` | `'hero' \| 'emotional'` | Ubicación en el layout |
| `title` | `string` | Título del banner |
| `subtitle` | `string` | Subtítulo |
| `ctaText` | `string` | Texto del botón CTA |
| `ctaLink` | `string` | URL de destino |
| `imageUrl` | `string` | Imagen desktop |
| `imagePath` | `string` | Path Storage desktop |
| `imageMobileUrl` | `string` | Imagen mobile (opcional) |
| `imageMobilePath` | `string` | Path Storage mobile |
| `active` | `boolean` | Visible en el sitio |
| `order` | `number` | Orden si hay múltiples banners |
| `updatedAt` | `Timestamp` | Auto |

**Reglas:** lectura pública siempre, escritura solo editors.

---

### `gallery`

Imágenes de la sección Instagram / Galería.

| Campo | Tipo | Descripción |
|---|---|---|
| `imageUrl` | `string` | URL de la imagen |
| `imagePath` | `string` | Path en Storage |
| `altText` | `string` | Texto alternativo |
| `link` | `string` | URL externa (post Instagram) |
| `active` | `boolean` | Visible en el sitio |
| `order` | `number` | Orden en la grilla |
| `createdAt` | `Timestamp` | Auto |

**Reglas:** lectura pública si `active == true`, escritura solo editors.

---

### `messages`

Consultas enviadas desde el formulario de contacto.

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | `string` | Nombre del remitente (requerido, ≤ 120 chars) |
| `email` | `string` | Email de contacto |
| `phone` | `string` | Teléfono (opcional) |
| `message` | `string` | Mensaje (requerido, ≤ 2000 chars) |
| `status` | `'pending' \| 'answered' \| 'archived'` | Estado de gestión |
| `read` | `boolean` | ¿Fue leído por el admin? |
| `createdAt` | `Timestamp` | Auto — serverTimestamp |

**Índices requeridos:**
- `status ASC + createdAt DESC`
- `read ASC + createdAt DESC`

**Reglas:**
- Creación pública (cualquier visitante puede enviar)
- Lectura/actualización/eliminación: solo editors

---

### `media`

Biblioteca de medios — registro de todas las imágenes subidas a Storage.

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | `string` | Nombre original del archivo |
| `url` | `string` | URL pública de Storage |
| `path` | `string` | Path en Storage (para borrar) |
| `folder` | `string` | Carpeta (`products`, `banners`, `gallery`, `uploads`…) |
| `mimeType` | `string` | Tipo MIME (ej: `image/jpeg`) |
| `size` | `number` | Tamaño en bytes |
| `altText` | `string` | Texto alternativo editable |
| `usedBy` | `string[]` | Doc IDs que referencian esta imagen (para orphan detection) |
| `createdAt` | `Timestamp` | Auto |

**Índices requeridos:**
- `createdAt DESC`

**Reglas:** lectura y escritura solo editors (privado, sin acceso público).

---

### `siteConfig` → documento `main`

Configuración global del sitio. **Un único documento** (`siteConfig/main`).

| Campo | Tipo | Descripción |
|---|---|---|
| `siteName` | `string` | Nombre del sitio |
| `tagline` | `string` | Slogan |
| `logoUrl` | `string` | URL del logo (Storage) |
| `logoPath` | `string` | Path Storage del logo |
| `whatsappNumber` | `string` | Número con código país (ej: `5491100000000`) |
| `whatsappMessage` | `string` | Mensaje predeterminado WA |
| `email` | `string` | Email de contacto |
| `instagram` | `string` | URL perfil Instagram |
| `facebook` | `string` | URL perfil Facebook |
| `tiktok` | `string` | URL perfil TikTok |
| `address` | `string` | Dirección física |
| `seoTitle` | `string` | `<title>` global del sitio |
| `seoDescription` | `string` | Meta description global |
| `updatedAt` | `Timestamp` | Auto |

**Reglas:** lectura pública siempre, escritura solo `admin`.

---

### `adminUsers`

Perfiles de los usuarios administradores del backoffice.  
El documento ID **debe coincidir** con el UID de Firebase Auth.

| Campo | Tipo | Descripción |
|---|---|---|
| `email` | `string` | Email del usuario (debe coincidir con Auth) |
| `displayName` | `string` | Nombre para mostrar en la UI |
| `role` | `'admin' \| 'editor'` | Rol del usuario (refleja el custom claim) |
| `active` | `boolean` | Si `false`, el usuario está deshabilitado sin borrar el registro |
| `lastLoginAt` | `Timestamp \| null` | Último acceso registrado |
| `createdAt` | `Timestamp` | Auto |
| `updatedAt` | `Timestamp` | Auto |

**Flujo de creación:**
1. Crear usuario en Firebase Auth (Console o Admin SDK)
2. Setear custom claim: `node scripts/set-admin-claim.js <uid> <role>`
3. Crear documento en `adminUsers/<uid>` con este esquema

**Reglas:** lectura y escritura solo `admin`. Los editors no pueden acceder.

---

### `auditLogs`

Registro inmutable de acciones administrativas. Solo se crean documentos, nunca se modifican ni eliminan (append-only).

| Campo | Tipo | Descripción |
|---|---|---|
| `action` | `string` | Tipo de acción — ver `AUDIT_ACTION` enum |
| `entity` | `string` | Colección afectada (ej: `products`, `banners`) |
| `entityId` | `string` | ID del documento afectado |
| `meta` | `object` | Contexto adicional (nombre, cambios, etc.) |
| `userId` | `string` | UID del usuario que realizó la acción |
| `userEmail` | `string` | Email del usuario (desnormalizado) |
| `createdAt` | `Timestamp` | Auto — serverTimestamp |

**Valores de `AUDIT_ACTION`:**

| Constante | Valor | Uso |
|---|---|---|
| `CREATE` | `'create'` | Documento creado |
| `UPDATE` | `'update'` | Documento actualizado |
| `DELETE` | `'delete'` | Documento eliminado |
| `PUBLISH` | `'publish'` | Producto o contenido publicado |
| `ARCHIVE` | `'archive'` | Producto o mensaje archivado |
| `UPLOAD` | `'upload'` | Imagen subida a Storage |
| `LOGIN` | `'login'` | Inicio de sesión admin |
| `LOGOUT` | `'logout'` | Cierre de sesión admin |
| `SETTING` | `'setting'` | Configuración del sitio modificada |

**Uso desde servicios:**
```js
import { auditLogService, AUDIT_ACTION } from '@/firebase/firebaseClient'
await auditLogService.log(AUDIT_ACTION.DELETE, 'products', product.id, { name: product.name })
```

**Índices requeridos:**
- `entity ASC + createdAt DESC`
- `userId ASC + createdAt DESC`
- `createdAt DESC`

**Reglas:** solo `admin` puede leer. La escritura (create) está permitida para cualquier usuario autenticado con rol `editor` o `admin`. No se permiten updates ni deletes.

---

## Roles y custom claims

Los roles se setean como **custom claims** en Firebase Auth mediante Admin SDK (nunca desde el cliente).

| Claim | Descripción | Permisos |
|---|---|---|
| `role: 'admin'` | Administrador total | Lectura + escritura en todas las colecciones, incluida `siteConfig` |
| `role: 'editor'` | Editor de contenido | Lectura + escritura en `products`, `categories`, `banners`, `gallery`, `messages`, `media` |

**Cómo setear un admin** (solo desde Admin SDK):
```js
// scripts/set-admin-claim.js
import admin from 'firebase-admin'
await admin.auth().setCustomUserClaims(uid, { role: 'admin' })
```

---

## Storage — estructura de carpetas

```
gs://[bucket]/
├── products/          # Imágenes de productos
├── categories/        # Imágenes de categorías
├── banners/           # Imágenes de banners (hero, emotional)
├── gallery/           # Imágenes de galería Instagram
├── uploads/           # Uploads desde la biblioteca de medios
└── settings/          # Logo y assets del sitio
```

**Reglas generales Storage:**
- Lectura pública: `products/`, `categories/`, `banners/`, `gallery/`, `uploads/`, `settings/`
- Escritura: solo `editor` o `admin`, imágenes ≤ 5 MB
- Todo lo demás: denegado

---

## App Check

- **Provider:** reCAPTCHA v3 (`VITE_RECAPTCHA_SITE_KEY`)
- **Dev mode:** debug token automático (`FIREBASE_APPCHECK_DEBUG_TOKEN = true`)
- **Degradación graceful:** si no hay site key configurada, App Check se deshabilita con un `console.warn` (no rompe la app)

---

## Índices — despliegue

```bash
firebase deploy --only firestore:indexes,firestore:rules,storage
```

Archivo de índices: `firestore.indexes.json`  
Reglas Firestore: `firestore.rules`  
Reglas Storage: `storage.rules`
