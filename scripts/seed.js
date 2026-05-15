/**
 * Seed script – run ONCE with: node scripts/seed.js
 *
 * Requires a serviceAccountKey.json in the project root (never commit it).
 * Download: Firebase Console → Project Settings → Service Accounts → Generate new key
 *
 * Usage:
 *   node scripts/seed.js
 *
 * Options:
 *   --reset   Drop and recreate all documents (use carefully)
 */

import admin from 'firebase-admin'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const serviceAccount = require('../serviceAccountKey.json')

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db  = admin.firestore()
const TS  = admin.firestore.FieldValue.serverTimestamp()

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function upsert(col, id, data) {
  await db.collection(col).doc(id).set({ ...data, updatedAt: TS }, { merge: true })
}

async function insert(col, data) {
  return db.collection(col).add({ ...data, createdAt: TS, updatedAt: TS })
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Starting Serena Glow seed…\n')

  // ── siteConfig ──────────────────────────────────────────────────────────────
  await upsert('siteConfig', 'main', {
    siteName:        'Serena Glow',
    tagline:         'Belleza que te hace sentir.',
    logoUrl:         '',
    logoPath:        '',
    whatsappNumber:  '5491100000000',
    whatsappMessage: 'Hola Serena Glow! Me gustaría conocer más sobre sus productos ✨',
    email:           'hola@serenaglow.com.ar',
    instagram:       'https://instagram.com/serenaglow',
    facebook:        '',
    tiktok:          '',
    address:         'Buenos Aires, Argentina',
    seoTitle:        'Serena Glow | Cosméticos, Perfumes y Body Care Premium',
    seoDescription:  'Descubrí nuestra selección de cosméticos, perfumes, body care y trajes de baño. Belleza femenina, elegante y sofisticada.',
  })
  console.log('  ✔ siteConfig/main')

  // ── Categories ──────────────────────────────────────────────────────────────
  const categories = [
    {
      slug: 'cosmeticos', name: 'Cosméticos', order: 1, active: true,
      description: 'Maquillaje y cuidado del rostro para una piel radiante.',
      imageUrl: '', imagePath: '',
    },
    {
      slug: 'perfumes', name: 'Perfumes', order: 2, active: true,
      description: 'Fragancias femeninas y unisex con notas únicas e irresistibles.',
      imageUrl: '', imagePath: '',
    },
    {
      slug: 'body-care', name: 'Body Care', order: 3, active: true,
      description: 'Hidratación, nutrición y cuidado corporal de alta gama.',
      imageUrl: '', imagePath: '',
    },
    {
      slug: 'trajes-de-bano', name: 'Trajes de baño', order: 4, active: true,
      description: 'Bikinis, enterizos y accesorios de playa de temporada.',
      imageUrl: '', imagePath: '',
    },
  ]

  for (const cat of categories) {
    await db.collection('categories').doc(cat.slug).set(
      { ...cat, createdAt: TS, updatedAt: TS },
      { merge: true },
    )
  }
  console.log(`  ✔ ${categories.length} categories`)

  // ── Products ─────────────────────────────────────────────────────────────────
  // 4 per category = 16 products total
  const products = [

    // ── COSMÉTICOS (4) ───────────────────────────────────────────────────────
    {
      slug: 'paleta-sombras-velvet-rose',
      name: 'Paleta de Sombras Velvet Rose',
      shortDescription: '12 sombras altamente pigmentadas en tonos rosados, beige y borgoña.',
      description: 'Formulada con aceites naturales que cuidan el párpado. Desde mates sedosos hasta brillantes tornasolados. Ideal para looks de día elegante y noche sofisticada. Incluye espejo y aplicador doble.',
      price: 9800, salePrice: null, currency: '$',
      categorySlug: 'cosmeticos', categoryName: 'Cosméticos',
      status: 'published', featured: true, order: 1,
      badge: 'Nuevo', tags: ['sombras', 'paleta', 'rose', 'maquillaje', 'ojos'],
      stock: 25, imageUrl: '', imagePath: '', images: [],
      attributes: [{ key: 'Tonos', value: '12 colores' }, { key: 'Acabado', value: 'Mate y shimmer' }],
    },
    {
      slug: 'labial-velvet-mauve',
      name: 'Labial Velvet Mauve',
      shortDescription: 'Labial de larga duración con fórmula aterciopelada y sin sangrado.',
      description: 'Color intenso desde la primera pasada. Enriquecido con vitamina E e hialurónico. No reseca ni pesa. Disponible en 8 tonos de la gama mauve-rose.',
      price: 4200, salePrice: 3500, currency: '$',
      categorySlug: 'cosmeticos', categoryName: 'Cosméticos',
      status: 'published', featured: true, order: 2,
      badge: 'Oferta', tags: ['labial', 'mauve', 'maquillaje', 'labios', 'larga duracion'],
      stock: 40, imageUrl: '', imagePath: '', images: [],
      attributes: [{ key: 'Duración', value: '8 horas' }, { key: 'Acabado', value: 'Velvet mate' }],
    },
    {
      slug: 'base-cobertura-seda',
      name: 'Base de Cobertura Seda',
      shortDescription: 'Base fluida de cobertura media a total con finish satinado.',
      description: 'Fórmula ultraligera con ácido hialurónico y SPF 15. Se funde con la piel creando un efecto segunda piel impecable. 12 tonos para todas las pieles.',
      price: 7600, salePrice: null, currency: '$',
      categorySlug: 'cosmeticos', categoryName: 'Cosméticos',
      status: 'published', featured: false, order: 3,
      badge: '', tags: ['base', 'maquillaje', 'cobertura', 'spf'],
      stock: 18, imageUrl: '', imagePath: '', images: [],
      attributes: [{ key: 'SPF', value: '15' }, { key: 'Tonos', value: '12 shades' }, { key: 'Tipo de piel', value: 'Mixta a normal' }],
    },
    {
      slug: 'rubor-peach-glow',
      name: 'Rubor Peach Glow',
      shortDescription: 'Rubor en polvo prensado con tono durazno luminoso y larga duración.',
      description: 'Pigmentación suave y buildable. Fórmula sin talco enriquecida con extracto de rosa mosqueta. Aporta un flush natural que dura todo el día.',
      price: 5100, salePrice: null, currency: '$',
      categorySlug: 'cosmeticos', categoryName: 'Cosméticos',
      status: 'published', featured: false, order: 4,
      badge: '', tags: ['rubor', 'blush', 'maquillaje', 'rostro'],
      stock: 30, imageUrl: '', imagePath: '', images: [],
      attributes: [{ key: 'Tono', value: 'Peach nude' }, { key: 'Sin talco', value: 'Sí' }],
    },

    // ── PERFUMES (4) ─────────────────────────────────────────────────────────
    {
      slug: 'perfume-serena-nuit-50ml',
      name: 'Serena Nuit EDP 50ml',
      shortDescription: 'Fragancia femenina amaderada con notas de vainilla y ámbar gris.',
      description: 'Eau de Parfum de larga duración creada para las noches de Buenos Aires. Abre con bergamota y rosa, el corazón revela jazmín y sándalo, y la base acaricia con vainilla bourbon y almizcle. Proyección intensa, estela hipnótica.',
      price: 24500, salePrice: 19900, currency: '$',
      categorySlug: 'perfumes', categoryName: 'Perfumes',
      status: 'published', featured: true, order: 1,
      badge: 'Bestseller', tags: ['perfume', 'amaderado', 'vainilla', 'noche', 'edp'],
      stock: 12, imageUrl: '', imagePath: '', images: [],
      attributes: [{ key: 'Concentración', value: 'Eau de Parfum' }, { key: 'Duración', value: '8-10 horas' }, { key: 'Notas', value: 'Bergamota, Jazmín, Vainilla' }],
    },
    {
      slug: 'perfume-rosa-blanca-30ml',
      name: 'Rosa Blanca EDP 30ml',
      shortDescription: 'Fragancia floral blanca de pureza y feminidad delicada.',
      description: 'Una oda a la elegancia discreta. Notas de cabeza: pera y magnolia. Corazón de rosa turca y peonia. Base de musgo blanco y cedro. Fresca, limpia y sofisticada.',
      price: 18000, salePrice: null, currency: '$',
      categorySlug: 'perfumes', categoryName: 'Perfumes',
      status: 'published', featured: true, order: 2,
      badge: 'Nuevo', tags: ['perfume', 'floral', 'rosa', 'fresco', 'edp'],
      stock: 15, imageUrl: '', imagePath: '', images: [],
      attributes: [{ key: 'Concentración', value: 'Eau de Parfum' }, { key: 'Duración', value: '6-8 horas' }, { key: 'Notas', value: 'Pera, Rosa turca, Cedro' }],
    },
    {
      slug: 'body-mist-coco-island',
      name: 'Body Mist Coco Island',
      shortDescription: 'Bruma corporal tropical con notas de coco, frangipani y sol.',
      description: 'Refrescá tu piel con esta bruma liviana que envuelve en un aroma de verano eterno. Hidrata levemente mientras perfuma. Ideal para aplicar después del baño o durante el día.',
      price: 5800, salePrice: null, currency: '$',
      categorySlug: 'perfumes', categoryName: 'Perfumes',
      status: 'published', featured: false, order: 3,
      badge: '', tags: ['body mist', 'coco', 'tropical', 'verano', 'bruma'],
      stock: null, imageUrl: '', imagePath: '', images: [],
      attributes: [{ key: 'Formato', value: 'Spray 200ml' }, { key: 'Notas', value: 'Coco, Frangipani, Vainilla' }],
    },
    {
      slug: 'roll-on-rose-oil',
      name: 'Roll-on Rose & Oud',
      shortDescription: 'Perfume en aceite con rosa turca y oud sirio. Sin alcohol.',
      description: 'Concentrado en aceite de jojoba, se adhiere a la piel creando una segunda piel perfumada. Sin alcohol — perfecto para pieles sensibles. Formato de bolso.',
      price: 8200, salePrice: null, currency: '$',
      categorySlug: 'perfumes', categoryName: 'Perfumes',
      status: 'published', featured: false, order: 4,
      badge: 'Exclusivo', tags: ['roll-on', 'aceite', 'rosa', 'oud', 'sin alcohol'],
      stock: 20, imageUrl: '', imagePath: '', images: [],
      attributes: [{ key: 'Formato', value: 'Roll-on 10ml' }, { key: 'Sin alcohol', value: 'Sí' }],
    },

    // ── BODY CARE (4) ────────────────────────────────────────────────────────
    {
      slug: 'crema-corporal-luminosa',
      name: 'Crema Corporal Luminosa',
      shortDescription: 'Hidratación profunda con efecto glow y aroma a vainilla orquídea.',
      description: 'Fórmula de textura sedosa con manteca de karité, aceite de jojoba y vitamina E. Activa la luminosidad natural de la piel con micropartículas perladas. Absorción rápida, sin residuo.',
      price: 7200, salePrice: null, currency: '$',
      categorySlug: 'body-care', categoryName: 'Body Care',
      status: 'published', featured: true, order: 1,
      badge: '', tags: ['crema', 'corporal', 'hidratante', 'luminosa', 'karite'],
      stock: null, imageUrl: '', imagePath: '', images: [],
      attributes: [{ key: 'Contenido', value: '250ml' }, { key: 'Tipo de piel', value: 'Todo tipo' }],
    },
    {
      slug: 'aceite-seco-rosa-mosqueta',
      name: 'Aceite Seco Rosa Mosqueta & Argán',
      shortDescription: 'Aceite seco multifunción para cuerpo, rostro y cabello.',
      description: 'Blend 100% natural de rosa mosqueta, argán y vitamina C que regenera, nutre y aporta elasticidad. No engrasa. Se absorbe instantáneamente dejando una piel tersa y luminosa.',
      price: 9500, salePrice: 7900, currency: '$',
      categorySlug: 'body-care', categoryName: 'Body Care',
      status: 'published', featured: true, order: 2,
      badge: 'Oferta', tags: ['aceite', 'rosa mosqueta', 'argan', 'natural', 'regenerador'],
      stock: 22, imageUrl: '', imagePath: '', images: [],
      attributes: [{ key: 'Contenido', value: '50ml' }, { key: '100% natural', value: 'Sí' }],
    },
    {
      slug: 'exfoliante-azucar-cafe',
      name: 'Exfoliante Azúcar & Café',
      shortDescription: 'Scrub corporal energizante con azúcar morena y café verde.',
      description: 'Elimina células muertas mientras activa la circulación. Enriquecido con aceite de almendras y extracto de café verde antioxidante. Piel suave, uniforme y luminosa desde el primer uso.',
      price: 5500, salePrice: null, currency: '$',
      categorySlug: 'body-care', categoryName: 'Body Care',
      status: 'published', featured: false, order: 3,
      badge: 'Fan favorite', tags: ['exfoliante', 'scrub', 'cafe', 'azucar', 'corporal'],
      stock: 35, imageUrl: '', imagePath: '', images: [],
      attributes: [{ key: 'Contenido', value: '200g' }, { key: 'Uso', value: '2-3 veces por semana' }],
    },
    {
      slug: 'crema-manos-gardenia',
      name: 'Crema de Manos Gardenia',
      shortDescription: 'Crema nutritiva para manos con extracto de gardenia y manteca de cacao.',
      description: 'Textura rica y cremosa de absorción rápida que repara y protege las manos. Sin residuo graso. Aroma floral delicado que perdura. Packaging elegante — ideal como regalo.',
      price: 3800, salePrice: null, currency: '$',
      categorySlug: 'body-care', categoryName: 'Body Care',
      status: 'published', featured: false, order: 4,
      badge: '', tags: ['crema manos', 'gardenia', 'cacao', 'nutritiva', 'regalo'],
      stock: null, imageUrl: '', imagePath: '', images: [],
      attributes: [{ key: 'Contenido', value: '75ml' }],
    },

    // ── TRAJES DE BAÑO (4) ───────────────────────────────────────────────────
    {
      slug: 'bikini-tropical-print',
      name: 'Bikini Tropical Print',
      shortDescription: 'Estampado tropical vibrante, corpiño con aro y bombacha colaless.',
      description: 'Tela de micropoliamida con protección UV+50 y secado ultra rápido. Corpiño reforzado con aro para mayor soporte. Diseño exclusivo de temporada. Colores que no destiñen.',
      price: 16500, salePrice: null, currency: '$',
      categorySlug: 'trajes-de-bano', categoryName: 'Trajes de baño',
      status: 'published', featured: true, order: 1,
      badge: 'Temporada', tags: ['bikini', 'tropical', 'verano', 'uv', 'estampado'],
      stock: 20, imageUrl: '', imagePath: '', images: [],
      attributes: [{ key: 'Talles', value: 'XS, S, M, L, XL' }, { key: 'UV', value: '+50 FPS' }, { key: 'Material', value: 'Micropoliamida / Elastano' }],
    },
    {
      slug: 'bikini-negro-minimal',
      name: 'Bikini Negro Minimal',
      shortDescription: 'Diseño minimalista negro con top triangular y tiro regulable.',
      description: 'El clásico atemporal reinventado. Top triangular con escote V profundo y tiras regulables. Bombacha clásica de cintura alta. Perfecta para looks de playa y piscina.',
      price: 14200, salePrice: 12000, currency: '$',
      categorySlug: 'trajes-de-bano', categoryName: 'Trajes de baño',
      status: 'published', featured: true, order: 2,
      badge: 'Oferta', tags: ['bikini', 'negro', 'minimal', 'verano', 'clasico'],
      stock: 18, imageUrl: '', imagePath: '', images: [],
      attributes: [{ key: 'Talles', value: 'XS, S, M, L' }, { key: 'Material', value: 'Poliamida 80% / Elastano 20%' }],
    },
    {
      slug: 'enterizo-cut-out-mauve',
      name: 'Enterizo Cut-Out Mauve',
      shortDescription: 'Enterizo entallado con aberturas laterales y espalda profunda.',
      description: 'Diseño arquitectónico en tono mauve que favorece toda silueta. Aberturas cut-out en laterales y espalda abierta tipo halter. Forro incorporado para mayor cobertura y comodidad.',
      price: 19800, salePrice: null, currency: '$',
      categorySlug: 'trajes-de-bano', categoryName: 'Trajes de baño',
      status: 'published', featured: false, order: 3,
      badge: 'Exclusivo', tags: ['enterizo', 'cut-out', 'mauve', 'espalda', 'halter'],
      stock: 10, imageUrl: '', imagePath: '', images: [],
      attributes: [{ key: 'Talles', value: 'S, M, L' }, { key: 'Forro', value: 'Sí' }, { key: 'Material', value: 'Lycra italiana' }],
    },
    {
      slug: 'pareo-boho-resort',
      name: 'Pareo Boho Resort',
      shortDescription: 'Pareo multiusos estilo resort con estampado boho en gasa liviana.',
      description: 'Versátil y elegante. Llevalo como falda, vestido, top o simplemente como pareo de playa. Gasa de viscosa de caída fluida con flecos en los bordes. Teñido artesanal único.',
      price: 8900, salePrice: null, currency: '$',
      categorySlug: 'trajes-de-bano', categoryName: 'Trajes de baño',
      status: 'published', featured: false, order: 4,
      badge: '', tags: ['pareo', 'boho', 'resort', 'playa', 'multiusos'],
      stock: null, imageUrl: '', imagePath: '', images: [],
      attributes: [{ key: 'Talle único', value: 'Sí' }, { key: 'Material', value: 'Viscosa / Gasa' }],
    },
  ]

  for (const prod of products) {
    await db.collection('products').doc(prod.slug).set(
      { ...prod, createdAt: TS, updatedAt: TS },
      { merge: true },
    )
  }
  console.log(`  ✔ ${products.length} products`)

  // ── Banners ─────────────────────────────────────────────────────────────────
  const banners = [
    {
      id: 'hero', position: 'hero', order: 1, active: true,
      title:    'Descubrí tu belleza natural',
      subtitle: 'Cosméticos, fragancias y cuidado personal que te hacen brillar',
      ctaText:  'Ver colección',
      ctaLink:  '/catalogo',
      imageUrl: '', imagePath: '', imageMobileUrl: '', imageMobilePath: '',
    },
    {
      id: 'emotional', position: 'emotional', order: 2, active: true,
      title:    'Regálate un momento para vos',
      subtitle: 'Porque cuidarte es la mejor inversión',
      ctaText:  'Explorar',
      ctaLink:  '/catalogo',
      imageUrl: '', imagePath: '', imageMobileUrl: '', imageMobilePath: '',
    },
  ]

  for (const b of banners) {
    await db.collection('banners').doc(b.id).set(
      { ...b, updatedAt: TS },
      { merge: true },
    )
  }
  console.log(`  ✔ ${banners.length} banners`)

  // ── Admin users placeholder ──────────────────────────────────────────────────
  // Note: actual Auth users must be created via Firebase Console or Admin SDK.
  // This seed creates the Firestore profile document only.
  // Replace the UID below with the real UID after creating the user.
  await db.collection('adminUsers').doc('REPLACE_WITH_REAL_UID').set({
    email:      'admin@serenaglow.com.ar',
    displayName:'Administradora Serena Glow',
    role:       'admin',
    active:     true,
    createdAt:  TS,
    updatedAt:  TS,
  }, { merge: true })
  console.log('  ✔ adminUsers placeholder (update UID after creating Auth user)')

  // ── Sample audit log ─────────────────────────────────────────────────────────
  await db.collection('auditLogs').add({
    action:     'create',
    entity:     'system',
    entityId:   'seed',
    meta:       { note: 'Initial seed run', productsCreated: products.length },
    userId:     'seed-script',
    userEmail:  'seed-script',
    createdAt:  TS,
  })
  console.log('  ✔ auditLogs initial entry')

  // ── Sample inquiry ────────────────────────────────────────────────────────────
  await db.collection('messages').add({
    name:      'María González',
    email:     'maria@ejemplo.com',
    phone:     '+54 11 5555-1234',
    message:   'Hola! Me interesa el perfume Serena Nuit. ¿Hacen envíos al interior?',
    status:    'pending',
    read:      false,
    createdAt: TS,
  })
  console.log('  ✔ messages sample inquiry')

  console.log('\n✅ Seed completed successfully!')
  console.log(`   ${products.length} products | ${categories.length} categories | ${banners.length} banners`)
  console.log('\n⚠️  Next steps:')
  console.log('   1. Create admin user in Firebase Console (Auth)')
  console.log('   2. Set custom claim:  node scripts/set-admin-claim.js <uid>')
  console.log('   3. Update adminUsers/<uid> doc with the real UID')
  console.log('   4. Deploy rules:      firebase deploy --only firestore:rules,firestore:indexes,storage')

  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
