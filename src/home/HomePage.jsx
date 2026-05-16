import PublicLayout from '@/shared/components/PublicLayout'
import Hero from './components/Hero/Hero'
import CategoryGrid from './components/CategoryGrid/CategoryGrid'
import FeaturedProducts from './components/FeaturedProducts/FeaturedProducts'
import EmotionalBanner from './components/EmotionalBanner/EmotionalBanner'
import InstagramGallery from './components/InstagramGallery/InstagramGallery'
import BannerBlock from '@/shared/components/BannerBlock/BannerBlock'
import { useHomeData } from './hooks/useHomeData'
import PageSpinner from '@/shared/components/ui/PageSpinner'

export default function HomePage() {
  const {
    heroBanner, categories, featuredProducts,
    emotionalBanner, gallery,
    homeMidBanner, homePreFooterBanner,
    loading,
  } = useHomeData()

  if (loading) return <PageSpinner />

  return (
    <PublicLayout>
      <Hero banner={heroBanner} />
      <CategoryGrid categories={categories} />
      <FeaturedProducts products={featuredProducts} />
      {homeMidBanner       && homeMidBanner.active       !== false && <BannerBlock banner={homeMidBanner} />}
      <EmotionalBanner banner={emotionalBanner} />
      <InstagramGallery images={gallery} />
      {homePreFooterBanner && homePreFooterBanner.active !== false && <BannerBlock banner={homePreFooterBanner} />}
    </PublicLayout>
  )
}
