import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default icon paths for Leaflet in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

const serviceLabels = {
  tow_truck: 'Tow Truck',
  mechanic: 'Mechanic',
  hotel: 'Hotel',
  medical: 'Medical',
  car_wash: 'Car Wash',
  electrician: 'Electrician',
  plumber: 'Plumber'
}

const serviceKeys = Object.keys(serviceLabels)

function Recenter({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, 14)
  }, [center, map])
  return null
}

function TextInput({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
      />
    </label>
  )
}

function CategoryChips({ active, onChange }) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className="flex gap-2 px-3 py-2">
        <Chip label="All" active={!active} onClick={() => onChange('')} />
        {serviceKeys.map((k) => (
          <Chip key={k} label={serviceLabels[k]} active={active === k} onClick={() => onChange(k)} />
        ))}
      </div>
    </div>
  )
}

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm border ${
        active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200'
      } shadow-sm`}
    >
      {label}
    </button>
  )
}

function FAB({ children, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full shadow-lg bg-white text-gray-800 p-3 hover:bg-gray-50 active:scale-95 transition ${className}`}
    >
      {children}
    </button>
  )
}

function AuthScreen({ onAuthed, onGuest, backend }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = password.length >= 6 && (phone || email)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const payload = mode === 'register'
        ? { name: name || undefined, phone: phone || undefined, email: email || undefined, password }
        : { phone: phone || undefined, email: email || undefined, password }
      const res = await fetch(`${backend}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}))
        throw new Error(msg.detail || 'Authentication failed')
      }
      const data = await res.json()
      const token = data.access_token
      const user = data.user
      localStorage.setItem('madad_token', token)
      localStorage.setItem('madad_user', JSON.stringify(user))
      onAuthed({ token, user })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-5">
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold text-emerald-700">Madad</div>
          <p className="text-xs text-gray-500">Pakistan’s map for help — tow, mechanic, hotel, medical and more</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
          <button onClick={() => setMode('login')} className={`flex-1 py-2 rounded-md ${mode==='login'?'bg-white shadow font-medium':''}`}>Login</button>
          <button onClick={() => setMode('register')} className={`flex-1 py-2 rounded-md ${mode==='register'?'bg-white shadow font-medium':''}`}>Register</button>
        </div>
        <form className="space-y-3" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <TextInput label="Full Name" value={name} onChange={setName} placeholder="e.g. Ali Raza" />
          )}
          <TextInput label="Phone (preferred)" value={phone} onChange={setPhone} placeholder="03xx-xxxxxxx" />
          <TextInput label="Email (optional)" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <TextInput label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" />

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button disabled={!canSubmit || loading} className="w-full py-2.5 rounded-lg bg-emerald-600 text-white disabled:opacity-60">
            {loading ? 'Please wait…' : (mode==='register' ? 'Create account' : 'Sign in')}
          </button>
        </form>

        <div className="relative py-2 text-center">
          <span className="px-2 text-xs text-gray-500 bg-white relative z-10">or</span>
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gray-200" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button disabled className="py-2 rounded-lg border bg-white text-gray-600 disabled:opacity-70">Google (soon)</button>
          <button disabled className="py-2 rounded-lg border bg-white text-gray-600 disabled:opacity-70">Apple (soon)</button>
        </div>

        <button onClick={onGuest} className="w-full py-2 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          Continue as Guest
        </button>

        <p className="text-[11px] text-center text-gray-500">Guest can browse the map. Sign in to add vendors and manage subscriptions.</p>
      </div>
    </div>
  )
}

export default function App() {
  const [position, setPosition] = useState(null)
  const [vendors, setVendors] = useState([])
  const [serviceType, setServiceType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [showAuthGate, setShowAuthGate] = useState(true)

  const backend = import.meta.env.VITE_BACKEND_URL || ''

  // Restore auth
  useEffect(() => {
    const t = localStorage.getItem('madad_token')
    const u = localStorage.getItem('madad_user')
    if (t) setToken(t)
    if (u) setUser(JSON.parse(u))
    // If a token exists, hide gate; otherwise keep it until user chooses guest
    setShowAuthGate(!t)
  }, [])

  // Verify token (optional; keeps session fresh)
  useEffect(() => {
    const verify = async () => {
      if (!token) return
      try {
        const res = await fetch(`${backend}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('session invalid')
      } catch {
        localStorage.removeItem('madad_token')
        localStorage.removeItem('madad_user')
        setToken(null)
        setUser(null)
        setShowAuthGate(true)
      }
    }
    verify()
  }, [token, backend])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setPosition([latitude, longitude])
      },
      () => setError('Location permission denied'),
      { enableHighAccuracy: true }
    )
  }, [])

  const fetchNearby = async () => {
    if (!position) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        lat: String(position[0]),
        lng: String(position[1]),
        radius_km: '5'
      })
      if (serviceType) params.set('service_type', serviceType)
      const res = await fetch(`${backend}/api/vendors/nearby?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setVendors(data.vendors || [])
    } catch (e) {
      setError('Could not load nearby vendors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNearby()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, serviceType])

  const center = useMemo(() => position || [24.8607, 67.0011], [position]) // Karachi default

  const handleAuthed = ({ token, user }) => {
    setToken(token)
    setUser(user)
    setShowAuthGate(false)
  }

  const handleGuest = () => {
    setShowAuthGate(false)
  }

  const logout = () => {
    localStorage.removeItem('madad_token')
    localStorage.removeItem('madad_user')
    setToken(null)
    setUser(null)
    setShowAuthGate(true)
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Top bar */}
      <header className="p-3 bg-white shadow z-10 flex items-center gap-3">
        <div>
          <h1 className="font-semibold leading-tight text-emerald-700">Madad</h1>
          <p className="text-[11px] text-gray-500">
            {user ? (
              <>Signed in{user.name ? ` as ${user.name}` : ''}</>
            ) : (
              <>Guest mode — sign in to add vendors</>
            )}
          </p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-2">
          <button onClick={fetchNearby} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg">
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          {user ? (
            <button onClick={logout} className="px-3 py-1.5 bg-gray-100 rounded-lg">Logout</button>
          ) : (
            <button onClick={() => setShowAuthGate(true)} className="px-3 py-1.5 bg-gray-100 rounded-lg">Sign in</button>
          )}
        </div>
      </header>

      {/* Category chips */}
      <div className="bg-white/90 border-b">
        <CategoryChips active={serviceType} onChange={setServiceType} />
      </div>

      {error && (
        <div className="p-2 text-center text-sm text-red-600 bg-red-50">{error}</div>
      )}

      <div className="flex-1 relative">
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter center={center} />

          {position && (
            <Marker position={position}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {vendors.map(v => (
            <Marker key={v.id} position={[v.location.coordinates[1], v.location.coordinates[0]]}>
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">{v.name}</div>
                  <div className="text-xs text-gray-600">{serviceLabels[v.service_type] || v.service_type}</div>
                  {v.address && <div className="text-xs">{v.address}</div>}
                  <div className="flex gap-2 pt-1">
                    {v.phone && (
                      <a href={`tel:${v.phone}`} className="px-2 py-1 bg-emerald-600 text-white rounded text-xs">Call Now</a>
                    )}
                    <a
                      className="px-2 py-1 bg-gray-800 text-white rounded text-xs"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${v.location.coordinates[1]},${v.location.coordinates[0]}`}
                      target="_blank" rel="noreferrer"
                    >
                      Get Directions
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating buttons */}
        <div className="absolute right-3 bottom-3 flex flex-col gap-2">
          <FAB onClick={fetchNearby}>🔄</FAB>
          <FAB onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((pos) => {
                setPosition([pos.coords.latitude, pos.coords.longitude])
              })
            }
          }}>📍</FAB>
        </div>
      </div>

      <footer className="p-2 text-center text-[11px] bg-white/80">Karachi default if location not granted. Urdu/English coming soon.</footer>

      {showAuthGate && (
        <div className="fixed inset-0 z-50">
          <AuthScreen onAuthed={handleAuthed} onGuest={handleGuest} backend={backend} />
        </div>
      )}
    </div>
  )
}
