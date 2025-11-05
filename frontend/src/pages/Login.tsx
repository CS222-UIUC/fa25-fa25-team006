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
      <p>{mode === 'login' ? 'Sign in to your CampusCache account' : 'Create a new CampusCache account to start exploring UIUC'}</p>
      <form onSubmit={onSubmit} className="card">
        <div>
          <label>Username</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="username" required minLength={3}/>
        </div>
        {mode==='register' && (
          <div>
            <label>Display name</label>
            <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name"/>
          </div>
        )}
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••" required minLength={6}/>
        </div>
        <div style={{display:'flex', gap:12, marginTop:8}}>
          <button type="submit">{mode==='login'?'Login':'Create account'}</button>
          <button type="button" onClick={()=>setMode(mode==='login'?'register':'login')}>
            Switch to {mode==='login'?'Register':'Login'}
          </button>
        </div>
      </form>
      {msg && <p style={{color: msg.includes('error') || msg.includes('wrong') || msg.includes('failed') ? '#dc3545' : '#28a745', padding: '12px', borderRadius: '8px', backgroundColor: msg.includes('error') || msg.includes('wrong') || msg.includes('failed') ? '#f8d7da' : '#d4edda', border: `1px solid ${msg.includes('error') || msg.includes('wrong') || msg.includes('failed') ? '#f5c6cb' : '#c3e6cb'}`}}>{msg}</p>}
    </div>
  )
}
