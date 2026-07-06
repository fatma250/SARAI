import { Routes, Route, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Chatbot from './components/Chatbot'
import Home from './pages/Home'
import StakeholderDirectory from './pages/StakeholderDirectory'
import ProjectStocktaking from './pages/ProjectStocktaking'
import KnowledgeMap from './pages/KnowledgeMap'
import ResourceLibrary from './pages/ResourceLibrary'
import Analytics from './pages/Analytics'
import SDGDirectory from './pages/SDGDirectory'
import Profile from './pages/Profile'
import CountryPage from './pages/CountryPage/CountryPage'
import AdminDashboard from './pages/AdminDashboard'
import ProjectDetails from './pages/ProjectDetails'
import SearchResults from './pages/SearchResults'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import VerifyEmail from './pages/Auth/VerifyEmail'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ResetPassword from './pages/Auth/ResetPassword'

function MainLayout() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 160px)' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stakeholders" element={<StakeholderDirectory />} />
          <Route path="/projects" element={<ProjectStocktaking />} />
          <Route path="/projects/:id/edit" element={<ProjectStocktaking />} />
          <Route path="/project/:id" element={<ProjectDetails />} />
          <Route path="/sdgs" element={<SDGDirectory />} />
          <Route path="/map" element={<KnowledgeMap />} />
          <Route path="/resources" element={<ResourceLibrary />} />
          <Route path="/statistics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/countries/:code" element={<CountryPage />} />
          <Route path="/search" element={<SearchResults />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </main>
      <Footer />
      <Chatbot />
    </>
  )
}

function App() {
  const location = useLocation()
  const isAdmin = location.pathname === '/admin'
  const { i18n } = useTranslation()
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr'

  return (
    <div className="app" dir={dir}>
      {isAdmin ? <AdminDashboard /> : <MainLayout />}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={dir === 'rtl'}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  )
}

export default App
