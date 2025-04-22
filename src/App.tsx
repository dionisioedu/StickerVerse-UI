import { useContext } from 'react'
import { AuthProvider, AuthContext } from './auth/AuthContext'
import Login from './pages/Login'
import Profile from './pages/Profile'

const App = () => {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  )
}

const Main = () => {
  const { user } = useContext(AuthContext)
  return user ? <Profile /> : <Login />
}

export default App