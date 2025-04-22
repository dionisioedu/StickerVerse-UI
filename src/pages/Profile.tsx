import { useContext } from 'react'
import { AuthContext } from '../auth/AuthContext'
import './Profile.css'

const Profile = () => {
  const { user, logout } = useContext(AuthContext)

  return (
    <div className="profile-container">
      <div className="profile-card animate-slide-in">
        <h2>Welcome, <span className="username">{user?.username}</span></h2>
        {user?.avatarUrl && (
          <img className="avatar" src={user.avatarUrl} alt="avatar" />
        )}
        <p className="email">{user?.email}</p>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>
    </div>
  )
}

export default Profile
