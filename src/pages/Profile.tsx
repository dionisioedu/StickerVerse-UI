import { useContext } from 'react'
import { AuthContext } from '../auth/AuthContext'

const Profile = () => {
  const { user, logout } = useContext(AuthContext)

  return (
    <div>
      <h2>Bem-vindo, {user?.username}</h2>
      {user?.avatarUrl && (
        <img src={user.avatarUrl} alt="avatar" style={{ borderRadius: '50%', width: 96 }} />
      )}
      <br /><br />
      <button onClick={logout}>Sair</button>
    </div>
  )
}

export default Profile