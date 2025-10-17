import React, { useState } from 'react'
import { login, register } from '../api'

export default function Login() {
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [msg, setMsg] = useState<string>('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (mode === 'login') {
        await login(username, password)
        setMsg('Logged in! You can now add caches from the Map page.')
      } else {
        await register(username, password, displayName)
        setMsg('Registered! Now switch to Login.')
      }
    } catch (err: any) {
      setMsg(err.message || 'Something went wrong')
    }
  }

  return (
    <div className="container">
      <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
      <form onSubmit={onSubmit} className="card">
        <div><label>Username</label><br/>
          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="username" required minLength={3}/>
        </div>
        {mode==='register' && (
          <div><label>Display name</label><br/>
            <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name"/>
          </div>
        )}
        <div><label>Password</label><br/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••" required minLength={6}/>
        </div>
        <div style={{display:'flex', gap:8, marginTop:8}}>
          <button type="submit">{mode==='login'?'Login':'Create account'}</button>
          <button type="button" onClick={()=>setMode(mode==='login'?'register':'login')}>
            Switch to {mode==='login'?'Register':'Login'}
          </button>
        </div>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  )
}
