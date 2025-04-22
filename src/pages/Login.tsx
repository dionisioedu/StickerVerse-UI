import { useContext } from 'react'
import { AuthContext } from '../auth/AuthContext'
import { GoogleLogin } from '@react-oauth/google'
import './Login.css'

const Login = () => {
  const { login } = useContext(AuthContext)

  return (
    <div className="login-container">
      <div className="login-panel animate-slide-in">
        <div className="logo-area">
          <h1 className="brand">StickerVerse</h1>
          <p className="subtitle">Create. Collect. Connect.</p>
        </div>

        <div className="description-box">
          <p>
            Welcome to the most vibrant and playful social network of 2025! On StickerVerse you can create your own digital stickers, collect rare ones, trade with friends, personalize your albums and even sign others’ collections.
          </p>
          <p>
            Stickers are more than images — they’re personality, community and creativity. Dive into a nostalgic and futuristic world where your imagination becomes collectible.
          </p>
        </div>

        <div className="login-section">
          <GoogleLogin
            onSuccess={credentialResponse => {
              if (credentialResponse.credential) {
                login(credentialResponse.credential)
              }
            }}
            onError={() => console.log('Login Failed')}
          />
        </div>

        <div className="links">
          <a href="#about">About</a>
          <a href="#how">How it works</a>
          <a href="#terms">Terms</a>
        </div>
      </div>
    </div>
  )
}

export default Login
