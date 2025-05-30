import { useContext, useState } from 'react'
import { AuthContext } from '../auth/AuthContext'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './Profile.css'
import Footer from '../components/Footer'

const apiBase = import.meta.env.VITE_API_BASE_URL

const Profile = () => {
  const { user, logout } = useContext(AuthContext)
  const [displayName, setDisplayName] = useState(user?.display || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const token = localStorage.getItem('jwt')
    if (!token) return

    try {
      setSaving(true)
      await axios.patch(`${apiBase}/me`, {
        display: displayName,
        bio: bio,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      location.reload()
    } catch (err) {
      console.error('Failed to update profile info', err)
      alert('Could not update profile info.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <div className="profile-container">
      <Link to="/" className="back-home" title="Back to home">← Back to home</Link>
      <div className="profile-card fade-in">
        {editing ? (
          <>
            <input
              className="edit-display"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              disabled={saving}
              placeholder="Display name"
            />

            <textarea
              className="edit-bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              disabled={saving}
              placeholder="Short bio (optional)"
            />

            <button className="save-btn" onClick={handleSave} disabled={saving || !displayName.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        ) : (
          <>
            <h2>
              Welcome, <span className="display" onClick={() => setEditing(true)}>
                {user?.display || user?.username} ✏️
              </span>
            </h2>

            {user?.bio && <p className="bio">{user.bio}</p>}
          </>
        )}

        {user?.avatarUrl && (
          <img className="avatar" src={user.avatarUrl} alt="avatar" />
        )}

        <p className="email">{user?.email}</p>

        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>
    </div>
    <Footer />
    </>
  )
}

export default Profile
