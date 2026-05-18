import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './providers/AuthProvider'
import PageSpinner from '@/shared/components/ui/PageSpinner'

const HomePage       = lazy(() => import('@/home/HomePage'))
const BlogPage       = lazy(() => import('@/blog/BlogPage'))
const BlogPostPage   = lazy(() => import('@/blog/BlogPostPage'))
const CatalogPage    = lazy(() => import('@/catalog/CatalogPage'))
const ProductPage    = lazy(() => import('@/catalog/ProductPage'))
const ContactPage    = lazy(() => import('@/contact/ContactPage'))
const NosotrasPage   = lazy(() => import('@/brand/NosotrasPage'))
const NotFoundPage   = lazy(() => import('@/not-found/NotFoundPage'))

const BackofficeLayout     = lazy(() => import('@/backoffice/BackofficeLayout'))
const BackofficeDashboard  = lazy(() => import('@/backoffice/dashboard/DashboardPage'))
const BackofficeProducts   = lazy(() => import('@/backoffice/products/ProductsPage'))
const BackofficeCategories = lazy(() => import('@/backoffice/categories/CategoriesPage'))
const BackofficeBanners    = lazy(() => import('@/backoffice/banners/BannersPage'))
const BackofficeMessages   = lazy(() => import('@/backoffice/messages/MessagesPage'))
const BackofficeSettings   = lazy(() => import('@/backoffice/settings/SettingsPage'))
const BackofficeMedia      = lazy(() => import('@/backoffice/media/MediaPage'))
const BackofficeBlogPosts  = lazy(() => import('@/backoffice/blog/BlogPostsPage'))
const BackofficeBlogForm   = lazy(() => import('@/backoffice/blog/BlogPostFormPage'))
const LoginPage            = lazy(() => import('@/backoffice/auth/LoginPage'))

function RequireAdmin({ children }) {
  const { user, role, loading } = useAuth()
  if (loading) return <PageSpinner />
  if (!user)   return <Navigate to="/admin/login" replace />
  if (role !== 'admin' && role !== 'editor') return <Navigate to="/admin/login" replace />
  return children
}

export default function Router() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/"               element={<HomePage />} />
        <Route path="/catalogo"        element={<CatalogPage />} />
        <Route path="/producto/:slug"  element={<ProductPage />} />
        <Route path="/contacto"        element={<ContactPage />} />
        <Route path="/nosotras"        element={<NosotrasPage />} />
        <Route path="/novedades"       element={<CatalogPage />} />
        <Route path="/blog"             element={<BlogPage />} />
        <Route path="/blog/:slug"        element={<BlogPostPage />} />

        {/* Admin auth */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Protected backoffice */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <BackofficeLayout />
            </RequireAdmin>
          }
        >
          <Route index                  element={<BackofficeDashboard />} />
          <Route path="productos"       element={<BackofficeProducts />} />
          <Route path="categorias"      element={<BackofficeCategories />} />
          <Route path="banners"         element={<BackofficeBanners />} />
          <Route path="galeria"         element={<Navigate to="/admin/media" replace />} />
          <Route path="mensajes"        element={<BackofficeMessages />} />
          <Route path="configuracion"   element={<BackofficeSettings />} />
          <Route path="media"            element={<BackofficeMedia />} />
          <Route path="blog"             element={<BackofficeBlogPosts />} />
          <Route path="blog/nuevo"       element={<BackofficeBlogForm />} />
          <Route path="blog/:id/editar"  element={<BackofficeBlogForm />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
