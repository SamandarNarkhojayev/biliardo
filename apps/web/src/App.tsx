import { lazy, Suspense, useEffect, useLayoutEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useApplyTheme } from '@/store/theme'
import { useApplyLocale } from '@/store/locale'
import { useAuthStore } from '@/store/auth'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SupportButton } from '@/components/layout/SupportButton'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ToastViewport } from '@/components/ui/Toast'

const Landing = lazy(() => import('@/pages/Landing'))
const Equipment = lazy(() => import('@/pages/Equipment'))
const Auth = lazy(() => import('@/pages/Auth'))
const Tournaments = lazy(() => import('@/pages/Tournaments'))
const TournamentDetail = lazy(() => import('@/pages/TournamentDetail'))
const Workspace = lazy(() => import('@/pages/Workspace'))
const Pricing = lazy(() => import('@/pages/Pricing'))
const PaymentCheckout = lazy(() => import('@/pages/PaymentCheckout'))
const PaymentReturn = lazy(() => import('@/pages/PaymentReturn'))
const ClubDashboardLayout = lazy(() => import('@/pages/club/ClubDashboardLayout'))
const ClubTables = lazy(() => import('@/pages/club/ClubTables'))
const ClubReports = lazy(() => import('@/pages/club/ClubReports'))
const ClubSettings = lazy(() => import('@/pages/club/ClubSettings'))
const Placeholder = lazy(() => import('@/pages/Placeholder'))
const About = lazy(() => import('@/pages/About'))
const Contacts = lazy(() => import('@/pages/Contacts'))
const Help = lazy(() => import('@/pages/Help'))
const Terms = lazy(() => import('@/pages/Terms'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Blog = lazy(() => import('@/pages/Blog'))
const TournamentGuide = lazy(() => import('@/pages/TournamentGuide'))
const Admin = lazy(() => import('@/pages/Admin'))

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25 } },
}

function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.main variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.main>
  )
}

// При смене маршрута прокручиваем страницу к началу (без эффекта для якорей).
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useLayoutEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash])
  return null
}

export default function App() {
  useApplyTheme()
  useApplyLocale()
  const location = useLocation()

  // Восстанавливаем сессию через refresh-cookie при первом рендере
  useEffect(() => {
    void useAuthStore.getState().bootstrap()
  }, [])

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <ScrollToTop />
      <Navbar />
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-text-muted">…</div>}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrap><Equipment /></PageWrap>} />
            <Route path="/club" element={<PageWrap><Landing /></PageWrap>} />
            <Route path="/auth" element={<PageWrap><Auth /></PageWrap>} />
            <Route path="/tournaments" element={<PageWrap><Tournaments /></PageWrap>} />
            <Route path="/tournaments/:id" element={<PageWrap><TournamentDetail /></PageWrap>} />
            <Route
              path="/me"
              element={<PageWrap><ProtectedRoute><Workspace /></ProtectedRoute></PageWrap>}
            />
            {/* Legacy: /dashboard и /profile теперь живут в одном /me с табами. */}
            <Route path="/dashboard" element={<Navigate to="/me?tab=mine" replace />} />
            <Route path="/profile" element={<Navigate to="/me?tab=settings" replace />} />
            <Route path="/pricing" element={<PageWrap><Pricing /></PageWrap>} />
            <Route
              path="/payment/checkout/:id"
              element={<PageWrap><ProtectedRoute><PaymentCheckout /></ProtectedRoute></PageWrap>}
            />
            <Route
              path="/payment/return"
              element={<PageWrap><ProtectedRoute><PaymentReturn /></ProtectedRoute></PageWrap>}
            />
            <Route
              path="/club/dashboard"
              element={<ProtectedRoute><ClubDashboardLayout /></ProtectedRoute>}
            >
              <Route index element={<ClubTables />} />
              <Route path="tables" element={<ClubTables />} />
              <Route path="reports" element={<ClubReports />} />
              <Route path="settings" element={<ClubSettings />} />
            </Route>
            <Route path="/about" element={<PageWrap><About /></PageWrap>} />
            <Route path="/contacts" element={<PageWrap><Contacts /></PageWrap>} />
            <Route path="/help" element={<PageWrap><Help /></PageWrap>} />
            <Route path="/terms" element={<PageWrap><Terms /></PageWrap>} />
            <Route path="/privacy" element={<PageWrap><Privacy /></PageWrap>} />
            <Route path="/blog" element={<PageWrap><Blog /></PageWrap>} />
            <Route path="/tournament-guide" element={<PageWrap><TournamentGuide /></PageWrap>} />
            <Route
              path="/admin"
              element={<PageWrap><ProtectedRoute><Admin /></ProtectedRoute></PageWrap>}
            />
            <Route path="*" element={<PageWrap><Placeholder title="Страница не найдена" description="Возможно, ты перешёл по битой ссылке." /></PageWrap>} />
          </Routes>
        </AnimatePresence>
      </Suspense>
      <Footer />
      <SupportButton />
      <ToastViewport />
    </div>
  )
}
