import { memo, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'

// Route-level code splitting: each page is a separate JS chunk loaded on demand.
// The browser only downloads EmployeesPage or InsightsPage when the user first
// navigates to that route, keeping the initial bundle smaller.
const EmployeesPage = lazy(() => import('@/pages/EmployeesPage'))
const InsightsPage  = lazy(() => import('@/pages/InsightsPage'))

/** Shown while a lazy page chunk is downloading */
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
      Loading…
    </div>
  )
}

const App = memo(function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Navbar />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"          element={<Navigate to="/employees" replace />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/insights"  element={<InsightsPage />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  )
})

export default App
