import { useContext, useState } from 'react'
import { AuthContext } from '../auth/AuthContext'
import { Link } from 'react-router-dom'
import './Dashboard.css'

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext)
  const [showSearch, setShowSearch] = useState(false)

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">StickerVerse</div>

        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search albums or stickers..."
            className={`search-input ${showSearch ? 'visible' : ''}`}
          />
          <button
            className="search-icon"
            onClick={() => setShowSearch(!showSearch)}
          >
            🔍
          </button>
        </div>

        <div>
            <p>Credits: {user?.credits} </p>
        </div>

        <div className="profile-menu">
          <img src={user?.avatarUrl} alt="avatar" className="dashboard-avatar" />
          <div className="dropdown">
            <Link to="/profile">Profile</Link>
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="album-grid">
        {/* Placeholder cards for now */}
        {[...Array(10)].map((_, i) => (
          <div className="album-card" key={i}>
            <div className="album-cover"></div>
            <div className="album-info">
              <h3>Album {i + 1}</h3>
              <p>by {user?.username}</p>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}

export default Dashboard
