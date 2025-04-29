import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom'

import { useContext } from 'react'
import { AuthProvider, AuthContext } from './auth/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import CreateSticker from './pages/CreateSticker'

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/createsticker" element={<CreateSticker />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

const Main = () => {
  const { user } = useContext(AuthContext)
  return user ? <Dashboard /> : <Login />
}

export default App