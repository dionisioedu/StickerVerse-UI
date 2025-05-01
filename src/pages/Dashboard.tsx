import { useContext, useState, useEffect } from 'react'
import { AuthContext } from '../auth/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import './Dashboard.css'
import { Album } from '../types/Album'
import { createAlbum, getUserAlbums } from '../api/albums'

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext)
  const [showSearch, setShowSearch] = useState(false)
  const navigate = useNavigate()
  const hasCredits = (user?.credits ?? 0) > 0;
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [newAlbum, setNewAlbum] = useState({
    name: '',
    description: '',
    isPrivate: false,
  })

  useEffect(() => {
    if (!loading && !user) {
      navigate('/#login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    getUserAlbums()
      .then(setAlbums)
      .catch(err => console.error('Error fetching albums:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleCreateAlbum = async () => {
    try {
      const created = await createAlbum(newAlbum)
      setAlbums(prev => [...prev, created])
      setNewAlbum({ name: '', description: '', isPrivate: false })
    } catch (err) {
      alert('Failed to create album')
      console.error(err)
    }
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo" onClick={() => window.location.href = '/'}>
          StickerVerse
        </div>

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
            <button
                disabled={!hasCredits}
                onClick={() => navigate('/create')}
                className="px-4 py-2 rounded shadow hover:bg-gray-200 create-sticker-button">
                ➕ Create Sticker
            </button>
        </div>

        <div className="profile-credits">
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
        {albums.map((album) => (
          <div className="album-card" key={album.id}>
            <div className="album-cover"></div>
            <div className="album-info">
              <h3>{album.name}</h3>
              <p>by {user?.username}</p>
            </div>
          </div>
        ))}

        <div className="album-card create-album-card">
          <h3>Create Album</h3>

          <input
            type="text"
            placeholder="Name"
            value={newAlbum.name}
            onChange={(e) => setNewAlbum({ ...newAlbum, name: e.target.value })}
          />

          <textarea
            placeholder="Description"
            value={newAlbum.description}
            onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
          />

          <label style={{ fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={newAlbum.isPrivate}
              onChange={(e) => setNewAlbum({ ...newAlbum, isPrivate: e.target.checked })}
            />
            Private
          </label>

          <button onClick={handleCreateAlbum} disabled={!newAlbum.name}>
            ➕ Create
          </button>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
