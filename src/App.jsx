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

const serviceLabels = {
  tow_truck: 'Tow Truck',
  mechanic: 'Mechanic',
  hotel: 'Hotel',
  medical: 'Medical',
  car_wash: 'Car Wash',
  electrician: 'Electrician',
  plumber: 'Plumber'
}

function Recenter({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, 14)
  }, [center, map])
  return null
}

export default function App() {
  const [position, setPosition] = useState(null)
  const [vendors, setVendors] = useState([])
  const [serviceType, setServiceType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const backend = import.meta.env.VITE_BACKEND_URL || ''

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

  return (
    <div className="h-screen w-screen flex flex-col">
      <header className="p-3 bg-white shadow z-10 flex items-center gap-2">
        <h1 className="font-semibold">Madad – All Services, One Map</h1>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All Services</option>
            {Object.entries(serviceLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button onClick={fetchNearby} className="px-3 py-1 bg-blue-600 text-white rounded">
            Refresh
          </button>
        </div>
      </header>

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
                      <a href={`tel:${v.phone}`} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Call Now</a>
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
      </div>

      <footer className="p-2 text-center text-xs bg-white/80">Built for MVP validation. Karachi default if location not granted.</footer>
    </div>
  )
}
