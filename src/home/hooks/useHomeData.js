import { useState, useEffect } from 'react'
import { bannerService }   from '@/firebase/services/bannerService'
import { categoryService } from '@/firebase/services/categoryService'
import { productService }  from '@/firebase/services/productService'
import { galleryService }  from '@/firebase/services/galleryService'

// ─── Mock fallback (used when Firestore is empty / not yet seeded) ───────────
const MOCK = {
  heroBanner: {
    id: 'hero',
    title:    'Belleza que resalta\ntu esencia',
    subtitle: 'Descubre nuestra selección de cosméticos, perfumes, cremas corporales y trajes de baño pensados para ti.',
    ctaText:  'Ver catálogo',
    ctaLink:  '/catalogo',
    imageUrl: null,
  },
  emotionalBanner: {
    id: 'emotional',
    title:    'Más que productos, creamos experiencias que resaltan tu mejor versión.',
    imageUrl: null,
  },
  categories: [
    { id: 'cosmeticos',    slug: 'cosmeticos',    name: 'Maquillaje',     tagline: 'Realzá tu belleza',   imageUrl: null, order: 1 },
    { id: 'perfumes',      slug: 'perfumes',      name: 'Perfumes',       tagline: 'Aromas que te definen', imageUrl: null, order: 2 },
    { id: 'body-care',     slug: 'body-care',     name: 'Body Care',      tagline: 'Cuidado que enamora',  imageUrl: null, order: 3 },
    { id: 'trajes-de-bano',slug: 'trajes-de-bano',name: 'Swimwear',       tagline: 'Estilo bajo el sol',   imageUrl: null, order: 4 },
  ],
  featuredProducts: [
    { id: '1', slug: 'paleta-sombras', name: 'Paleta Velvet Rose', categoryName: 'Maquillaje', price: 9800, salePrice: null, currency: '$', badge: 'Nuevo',      imageUrl: null },
    { id: '2', slug: 'labial-mauve',   name: 'Labial Velvet Mauve', categoryName: 'Maquillaje', price: 4200, salePrice: 3500, currency: '$', badge: 'Oferta',     imageUrl: null },
    { id: '3', slug: 'serena-nuit',    name: 'Serena Nuit EDP',   categoryName: 'Perfumes',   price: 24500, salePrice: 19900, currency: '$', badge: 'Bestseller', imageUrl: null },
    { id: '4', slug: 'rosa-blanca',    name: 'Rosa Blanca EDP',   categoryName: 'Perfumes',   price: 18000, salePrice: null, currency: '$', badge: 'Nuevo',      imageUrl: null },
    { id: '5', slug: 'crema-corporal', name: 'Crema Luminosa',    categoryName: 'Body Care',  price: 7200,  salePrice: null, currency: '$', badge: '',           imageUrl: null },
  ],
  gallery: [],
}

export function useHomeData() {
  const [data,    setData]    = useState({
    heroBanner: null, emotionalBanner: null,
    homeMidBanner: null, homePreFooterBanner: null,
    categories: [], featuredProducts: [], gallery: [],
  })
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      try {
        const [
          heroBanner, emotionalBanner,
          homeMidBanner, homePreFooterBanner,
          categories, featuredResult, gallery,
        ] = await Promise.all([
          bannerService.getById('hero').catch(() => null),
          bannerService.getById('emotional').catch(() => null),
          bannerService.getById('home-mid').catch(() => null),
          bannerService.getById('home-pre-footer').catch(() => null),
          categoryService.getActive().catch(() => []),
          productService.getFeatured(8).catch(() => []),
          galleryService.getActive(9).catch(() => []),
        ])

        if (!cancelled) {
          setData({
            heroBanner:          heroBanner      ?? MOCK.heroBanner,
            emotionalBanner:     emotionalBanner ?? MOCK.emotionalBanner,
            homeMidBanner:       homeMidBanner,
            homePreFooterBanner: homePreFooterBanner,
            categories:          categories.length     ? categories     : MOCK.categories,
            featuredProducts:    featuredResult.length ? featuredResult : MOCK.featuredProducts,
            gallery,
          })
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setLoading(false)
        }
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [])

  return { ...data, loading, error }
}
