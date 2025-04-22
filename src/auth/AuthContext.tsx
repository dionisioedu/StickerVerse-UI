import { createContext, useState, useEffect } from 'react'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import axios from 'axios'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
const apiBase = import.meta.env.VITE_API_BASE_URL

type User = {
  id: string
  username: string
  email: string
  avatarUrl?: string
}

type AuthContextType = {
  user: User | null
  login: (token: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)

  const login = async (token: string) => {
    try {
      const res = await axios.post(`${apiBase}/auth/google`, { token })
      localStorage.setItem('jwt', res.data.token)
      setUser(res.data.user)
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  const logout = () => {
    localStorage.removeItem('jwt')
    setUser(null)
  }

  useEffect(() => {
    const token = localStorage.getItem('jwt')
    if (token) {
      console.log("Trying to retrieve session with token:", token)
      axios.get(`${apiBase}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setUser(res.data.user)
      }).catch(() => logout())
    }
  }, [])

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthContext.Provider value={{ user, login, logout }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  )
}