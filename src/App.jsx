import { useEffect, useMemo, useState } from 'react'
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

// Fun, versatile color themes (no external API needed)
const themes = {
  emerald: {
    name: 'Emerald',
    primaryBg: 'bg-emerald-600',
    primaryBgHover: 'hover:bg-emerald-700',
    primaryText: 'text-emerald-700',
    ring: 'focus:ring-emerald-600',
    border: 'border-emerald-200',
    chipActiveBorder: 'border-emerald-600'
  },
  sky: {
    name: 'Sky',
    primaryBg: 'bg-sky-600',
    primaryBgHover: 'hover:bg-sky-700',
    primaryText: 'text-sky-700',
    ring: 'focus:ring-sky-600',
    border: 'border-sky-200',
    chipActiveBorder: 'border-sky-600'
  },
  fuchsia: {
    name: 'Fuchsia',
    primaryBg: 'bg-fuchsia-600',
    primaryBgHover: 'hover:bg-fuchsia-700',
    primaryText: 'text-fuchsia-700',
    ring: 'focus:ring-fuchsia-600',
    border: 'border-fuchsia-200',
    chipActiveBorder: 'border-fuchsia-600'
  },
  amber: {
    name: 'Amber',
    primaryBg: 'bg-amber-600',
    primaryBgHover: 'hover:bg-amber-700',
    primaryText: 'text-amber-700',
    ring: 'focus:ring-amber-600',
    border: 'border-amber-200',
    chipActiveBorder: 'border-amber-600'
  },
  lime: {
    name: 'Lime',
    primaryBg: 'bg-lime-600',
    primaryBgHover: 'hover:bg-lime-700',
    primaryText: 'text-lime-700',
    ring: 'focus:ring-lime-600',
    border: 'border-lime-200',
    chipActiveBorder: 'border-lime-600'
  }
}
const themeKeys = Object.keys(themes)

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

function TextInput({ label, type = 'text', value, onChange, placeholder, ringClass }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${ringClass}`}
      />
    </label>
  )
}

function CategoryChips({ active, onChange, theme }) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className="flex gap-2 px-3 py-2">
        <Chip label="All" active={!active} onClick={() => onChange('')} theme={theme} />
        {serviceKeys.map((k) => (
          <Chip key={k} label={serviceLabels[k]} active={active === k} onClick={() => onChange(k)} theme={theme} />
        ))}
      </div>
    </div>
  )
}

function Chip({ label, active, onClick, theme }) {
  const t = themes[theme]
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm border shadow-sm ${
        active ? `${t.primaryBg} text-white ${t.chipActiveBorder}` : 'bg-white text-gray-700 border-gray-200'
      }`}
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

function ThemeSelector({ theme, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {themeKeys.map((k) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`h-7 px-2 rounded-lg border text-xs ${
            theme === k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'
          }`}
        >
          {themes[k].name}
        </button>
      ))}
    </div>
  )
}

function AuthScreen({ onAuthed, onGuest, backend, theme }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = password.length >= 6 && (phone || email)
  const t = themes[theme]

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
          <div className={`text-2xl font-bold ${t.primaryText}`}>Madad</div>
          <p className="text-xs text-gray-500">Pakistan’s map for help — tow, mechanic, hotel, medical and more</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
          <button onClick={() => setMode('login')} className={`flex-1 py-2 rounded-md ${mode==='login'?'bg-white shadow font-medium':''}`}>Login</button>
          <button onClick={() => setMode('register')} className={`flex-1 py-2 rounded-md ${mode==='register'?'bg-white shadow font-medium':''}`}>Register</button>
        </div>
        <form className="space-y-3" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <TextInput label="Full Name" value={name} onChange={setName} placeholder="e.g. Ali Raza" ringClass={t.ring} />
          )}
          <TextInput label="Phone (preferred)" value={phone} onChange={setPhone} placeholder="03xx-xxxxxxx" ringClass={t.ring} />
          <TextInput label="Email (optional)" type="email" value={email} onChange={setEmail} placeholder="you@example.com" ringClass={t.ring} />
          <TextInput label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" ringClass={t.ring} />

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button disabled={!canSubmit || loading} className={`w-full py-2.5 rounded-lg text-white disabled:opacity-60 ${t.primaryBg} ${t.primaryBgHover}`}>
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

        <button onClick={onGuest} className={`w-full py-2 rounded-lg border text-emerald-700 hover:bg-emerald-50 ${t.border}`}>
          Continue as Guest
        </button>

        <p className="text-[11px] text-center text-gray-500">Guest can browse the map. Sign in to add vendors and manage subscriptions.</p>
        <div className="text-[11px] text-center text-gray-500">
          Payments: bank transfer will be available. No card or API required.
        </div>
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

  const [theme, setTheme] = useState('emerald')

  const backend = import.meta.env.VITE_BACKEND_URL || ''

  // Restore auth
  useEffect(() => {
    const t = localStorage.getItem('madad_token')
    const u = localStorage.getItem('madad_user')
    if (t) setToken(t)
    if (u) setUser(JSON.parse(u))
    setShowAuthGate(!t)

    const savedTheme = localStorage.getItem('madad_theme')
    if (savedTheme && themes[savedTheme]) setTheme(savedTheme)
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

  const t = themes[theme]

  const handleThemeChange = (k) => {
    setTheme(k)
    localStorage.setItem('madad_theme', k)
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Top bar */}
      <header className="p-3 bg-white shadow z-10 flex items-center gap-3">
        <div>
          <h1 className={`font-semibold leading-tight ${t.primaryText}`}>Madad</h1>
          <p className="text-[11px] text-gray-500">
            {user ? (
              <>Signed in{user.name ? ` as ${user.name}` : ''}</>
            ) : (
              <>Guest mode — sign in to add vendors</>
            )}
          </p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-2">
          <ThemeSelector theme={theme} onChange={handleThemeChange} />
          <button onClick={fetchNearby} className={`px-3 py-1.5 text-white rounded-lg ${t.primaryBg} ${t.primaryBgHover}`}>
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
        <CategoryChips active={serviceType} onChange={setServiceType} theme={theme} />
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
                      <a href={`tel:${v.phone}`} className={`px-2 py-1 text-white rounded text-xs ${t.primaryBg} ${t.primaryBgHover}`}>Call Now</a>
                    )}
                    <a
                      className="px-2 py-1 bg-gray-800 text-white rounded text-xs"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${v.location.coordinates[1]},${v.location.coordinates[0]}`}
                      target="_blank" rel="noreferrer"
                    >
                      Get Directions
                    </a>
                  </div>
                  <div className="pt-1 text-[11px] text-gray-500">Vendors will soon be able to pay via bank transfer to appear here.</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating buttons */}
        <div className="absolute right-3 bottom-3 flex flex-col gap-2">
          <button onClick={fetchNearby} className={`rounded-full shadow-lg text-white p-3 active:scale-95 transition ${t.primaryBg} ${t.primaryBgHover}`}>🔄</button>
          <button onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((pos) => {
                setPosition([pos.coords.latitude, pos.coords.longitude])
              })
            }
          }} className={`rounded-full shadow-lg text-white p-3 active:scale-95 transition ${t.primaryBg} ${t.primaryBgHover}`}>📍</button>
        </div>
      </div>

      <footer className="p-2 text-center text-[11px] bg-white/80">Karachi default if location not granted. Urdu/English coming soon.</footer>

      {showAuthGate && (
        <div className="fixed inset-0 z-50">
          <AuthScreen onAuthed={handleAuthed} onGuest={handleGuest} backend={backend} theme={theme} />
        </div>
      )}

      {/* Safety net to ensure Tailwind keeps these classes in the build */}
      <div className="hidden">
        bg-emerald-600 hover:bg-emerald-700 text-emerald-700 focus:ring-emerald-600 border-emerald-200 border-emerald-600
        bg-sky-600 hover:bg-sky-700 text-sky-700 focus:ring-sky-600 border-sky-200 border-sky-600
        bg-fuchsia-600 hover:bg-fuchsia-700 text-fuchsia-700 focus:ring-fuchsia-600 border-fuchsia-200 border-fuchsia-600
        bg-amber-600 hover:bg-amber-700 text-amber-700 focus:ring-amber-600 border-amber-200 border-amber-600
        bg-lime-600 hover:bg-lime-700 text-lime-700 focus:ring-lime-600 border-lime-200 border-lime-600
      </div>
    </div>
  )
}
