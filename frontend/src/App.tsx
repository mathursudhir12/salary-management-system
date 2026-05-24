import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import EmployeesPage from '@/pages/EmployeesPage'
import InsightsPage from '@/pages/InsightsPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/employees" replace />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/insights"  element={<InsightsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
