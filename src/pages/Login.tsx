import { useContext } from 'react'
import { AuthContext } from '../auth/AuthContext'
import { GoogleLogin } from '@react-oauth/google'

const Login = () => {
  const { login } = useContext(AuthContext)

  return (
    <div>
      <h2>Entre no StickerVerse</h2>
      <GoogleLogin
        onSuccess={credentialResponse => {
          if (credentialResponse.credential) {
            login(credentialResponse.credential)
          }
        }}
        onError={() => console.log('Login Failed')}
      />
    </div>
  )
}

export default Login