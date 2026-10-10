import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import ProtectedRoute from './auth/ProtectedRoute'
import Auth from './pages/Auth'
import Copilot from './pages/Copilot'
import Dashboard from './pages/Dashboard'
import DonorDetail from './pages/DonorDetail'
import Donors from './pages/Donors'
import Import from './pages/Import'
import ImpactWall from './pages/ImpactWall'
import Landing from './pages/Landing'
import ReviewQueue from './pages/ReviewQueue'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/impact" element={<ImpactWall />} />
      <Route path="/login" element={<Auth />} />
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="review-queue" element={<ReviewQueue />} />
                <Route path="copilot" element={<Copilot />} />
                <Route path="donors" element={<Donors />} />
                <Route path="donors/:id" element={<DonorDetail />} />
                <Route path="import" element={<Import />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
