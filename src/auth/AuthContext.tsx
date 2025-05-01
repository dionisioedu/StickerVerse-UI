import { createContext, useState, useEffect } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import axios from 'axios'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
const apiBase = import.meta.env.VITE_API_BASE_URL

export type User = {
  id: string
  username: string
  email: string
  avatarUrl?: string
  credits: number
  display?: string
  bio?: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (token: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const login = async (token: string) => {
    try {
      setLoading(true)
      const res = await axios.post(`${apiBase}/auth/google`, { token })
      localStorage.setItem('jwt', res.data.token)
      setUser(res.data.user)
      window.location.href = '/'
    } catch (err) {
      console.error('Login failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('jwt')
    setUser(null)
    window.location.href = '/#login'
  }

  useEffect(() => {
    const token = localStorage.getItem('jwt')
    if (token) {
      axios.get(`${apiBase}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setUser(res.data.user)
        })
        .catch(() => {
          console.warn("Session expired or invalid. Logging out...")
          logout()
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthContext.Provider value={{ user, login, logout, loading }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  )
} 
