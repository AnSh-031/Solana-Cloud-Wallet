import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [isSignedUp, setSignedUp] = useState(true)
  const [isSignedIn, setSignedIn] = useState(false)

  function handleSignOut() {
    localStorage.removeItem('token')
    setSignedIn(false)
  }

  return (
    <>
      {!isSignedUp ? (
        <SignUp setSignedUp={setSignedUp} />
      ) : !isSignedIn ? (
        <SignIn setSignedIn={setSignedIn} setSignedUp={setSignedUp} />
      ) : (
        <Wallet onSignOut={handleSignOut} />
      )}
    </>
  )
}

function SignUp({ setSignedUp }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function create() {
    setLoading(true)
    const response = await fetch('http://localhost:3000/app/v1/signup', {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await response.json()
    setLoading(false)
    if (data.msg) { alert(data.msg); setSignedUp(true) }
    else alert(data.error)
  }

  return (
    <div className="page">
      <div className="card">
        <div className="brand">Solana Wallet</div>
        <h1>Create account</h1>
        <p className="subtitle">Set up your wallet.</p>
        <div className="field">
          <label>Username</label>
          <input type="text" placeholder="username" onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" placeholder="password" onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn-main" onClick={create} disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </button>
        <hr className="divider" />
        <p className="switch-text">Already have an account? <button onClick={() => setSignedUp(true)}>Sign in</button></p>
      </div>
    </div>
  )
}

function SignIn({ setSignedIn, setSignedUp }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function verify() {
    setLoading(true)
    const response = await fetch('http://localhost:3000/app/v1/signin', {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await response.json()
    setLoading(false)
    if (data.token) { localStorage.setItem('token', data.token); setSignedIn(true) }
    else alert('Invalid credentials')
  }

  return (
    <div className="page">
      <div className="card">
        <div className="brand">Solana Wallet</div>
        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to continue.</p>
        <div className="field">
          <label>Username</label>
          <input type="text" placeholder="username" onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" placeholder="password" onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn-main" onClick={verify} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <hr className="divider" />
        <p className="switch-text">No account yet? <button onClick={() => setSignedUp(false)}>Create one</button></p>
      </div>
    </div>
  )
}

function Wallet({ onSignOut }) {
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState(0)
  const [showTxns, setShowTxns] = useState(false)
  const [allTxns, setTxns] = useState([])
  const [isLoading, setLoading] = useState(false)
  const [publicKey, setPublicKey] = useState('')
  const [balance, setBalance] = useState(0)
  const [copied, setCopied] = useState(false)

  async function getWallet() {
    const response = await fetch('http://localhost:3000/app/v1/wallet', {
      method: 'GET',
      headers: { 'Content-type': 'application/json', token: localStorage.getItem('token') },
    })
    const data = await response.json()
    if (data) { setPublicKey(data.publicKey); setBalance(data.balance) }
  }

  useEffect(() => { getWallet() }, [])

  function copyAddress() {
    navigator.clipboard.writeText(publicKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function sendSol() {
    setLoading(true)
    const response = await fetch('http://localhost:3000/app/v1/txn', {
      method: 'POST',
      headers: { 'Content-type': 'application/json', token: localStorage.getItem('token') },
      body: JSON.stringify({ to: address, amount }),
    })
    const data = await response.json()
    setLoading(false)
    if (data.signature) { alert('Transaction successful.\nSignature: ' + data.signature); getWallet() }
    else alert('Transaction failed.')
  }

  async function toggleTxns() {
    if (showTxns) { setShowTxns(false); return }
    const response = await fetch('http://localhost:3000/app/v1/txn', {
      method: 'GET',
      headers: { 'Content-type': 'application/json', token: localStorage.getItem('token') },
    })
    const data = await response.json()
    if (data) { setTxns(data.txns); setShowTxns(true) }
  }

  return (
    <div className="wallet-wrap">
      <div className="wallet-inner">

        <div className="nav">
          <span className="nav-brand">Solana Wallet</span>
          <button className="btn-text" onClick={onSignOut}>Sign out</button>
        </div>

        <div className="balance-block">
          <div className="bal-label">Balance</div>
          <div className="bal-amount">{balance}<em>SOL</em></div>
          <div className="address-line">
            <span className="address-val">{publicKey || '—'}</span>
            <button className="copy-btn" onClick={copyAddress}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
        </div>

        <div className="send-section">
          <div className="section-title">Send</div>
          <div className="send-row">
            <div className="field" style={{marginBottom: 0}}>
              <label>Recipient</label>
              <input type="text" placeholder="Wallet address" onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="field" style={{marginBottom: 0}}>
              <label>Amount (SOL)</label>
              <input type="number" placeholder="0.00" min="0" step="0.01" onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <button className="btn-send" onClick={sendSol} disabled={isLoading}>
            {isLoading ? 'Sending…' : 'Send SOL'}
          </button>
        </div>

        <div className="txn-section">
          <div className="txn-toggle" onClick={toggleTxns}>
            <span className="txn-toggle-label">{showTxns ? 'Hide transactions' : 'Transactions'}</span>
            <span className="txn-toggle-icon">{showTxns ? '↑' : '↓'}</span>
          </div>

          {showTxns && (
            <div className="txn-list">
              {allTxns.length === 0 && <p className="empty">No transactions yet.</p>}
              {allTxns.map((txn) => (
                <div className="txn-item" key={txn._id}>
                  <div className="txn-parties">
                    <strong>From</strong> {txn.Payer}<br />
                    <strong>To</strong> {txn.recipient}
                  </div>
                  <div className="txn-right">
                    <div className="txn-amount">{txn.amount} SOL</div>
                    <div className="txn-time">{new Date(txn.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="txn-sig">{txn.signature}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default App
