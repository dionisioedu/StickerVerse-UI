import { useContext, useState, useEffect } from 'react'
import { AuthContext } from '../auth/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import './Dashboard.css'
import Footer from '../components/Footer'
import UltraMiniLoloGame from '../components/UltraMiniLoloGame'

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  return (
    <>
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo" onClick={() => window.location.href = '/'}>
          StickerVerse
        </div>

        <div className="profile-credits">
            <p>Credits: <b>{user?.credits}</b> </p>
        </div>

        <div className="profile-menu">
          <img src={user?.avatarUrl} alt="avatar" className="dashboard-avatar" />
          <div className="dropdown">
            <Link to="/profile">Profile</Link>
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <UltraMiniLoloGame />
    </div>
    <Footer />
    </>
  )
}

export default Dashboard
