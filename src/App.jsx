import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import Auth from './components/Auth'
import socketService from './services/socket'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      // Disconnect first to ensure clean connection
      socketService.disconnect()
      // Small delay to ensure disconnect completes
      setTimeout(() => {
        socketService.connect(token)
      }, 100)
    }
  }, [])

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    socketService.connect(token)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    socketService.disconnect()
    setUser(null)
  }

  return (
    <div className="App">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Auth onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App
