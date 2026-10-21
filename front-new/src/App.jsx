import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'

// Les autres pages sont chargées à la demande pour alléger le premier chargement
const Avendre = lazy(() => import('./pages/Avendre'))
const Alouer = lazy(() => import('./pages/Alouer'))
const Prestation = lazy(() => import('./pages/Prestation'))
const Apropos = lazy(() => import('./pages/Apropos'))
const PropertyDetails = lazy(() => import('./pages/PropertyDetails'))
const Recherche = lazy(() => import('./pages/Recherche'))
const Favoris = lazy(() => import('./pages/Favoris'))
const Contact = lazy(() => import('./pages/Contact'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Admin pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const Login = lazy(() => import('./pages/admin/Login'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Properties = lazy(() => import('./pages/admin/Properties'))
const Messages = lazy(() => import('./pages/admin/Messages'))
const Team = lazy(() => import('./pages/admin/Team'))
const Account = lazy(() => import('./pages/admin/Account'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
  </div>
)

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/Avendre" element={<Avendre />} />
        <Route path="/Alouer" element={<Alouer />} />
        <Route path="/Prestation" element={<Prestation />} />
        <Route path="/Apropos" element={<Apropos />} />
        <Route path="/Recherche" element={<Recherche />} />
        <Route path="/property/:id" element={<PropertyDetails />} />
        <Route path="/favoris" element={<Favoris />} />
        <Route path="/contact" element={<Contact />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="properties" element={<Properties />} />
          <Route path="messages" element={<Messages />} />
          <Route path="team" element={<Team />} />
          <Route path="account" element={<Account />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default App
