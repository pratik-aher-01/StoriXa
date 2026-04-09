import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb'
const DEFAULT_TELEMETRY_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb'

const INITIAL_READING = {
  temperature: 28.5,
  humidity: 63.0,
  ethylene: 215.0,
  frequency: 50.0, // New frequency block for healthy plan
  timestamp: Date.now(),
  source: 'simulated',
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function parseNumeric(value, fallback = 0) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function calculateRisk(reading) {
  // To keep StoriXa Score between 95-100, risk must be between 0-5
  const tempRisk = clamp((reading.temperature - 27) / 3, 0, 1) * 2
  const humidityRisk = clamp((reading.humidity - 62) / 2, 0, 1) * 1.5
  const ethyleneRisk = clamp((reading.ethylene - 180) / 70, 0, 1) * 1.5

  return Math.round(clamp(tempRisk + humidityRisk + ethyleneRisk, 0, 5))
}

export function calculateShelfLife(reading) {
  const risk = calculateRisk(reading)
  const remainingDays = clamp(7 - risk / 16, 0.5, 7.5)
  const extensionDays = clamp(Math.round((100 - risk) / 22), 1, 5)
  const wasteReduction = clamp(Math.round(42 - risk / 3), 8, 42)
  const profitIncrease = clamp(Math.round(11 + (100 - risk) / 4), 12, 35)

  return {
    remainingDays: Number(remainingDays.toFixed(1)),
    extensionDays,
    wasteReduction,
    profitIncrease,
  }
}

export function getRiskLevel(risk) {
  if (risk >= 76) return 'critical'
  if (risk >= 45) return 'warning'
  return 'stable'
}

function parseTelemetryPayload(payload) {
  const trimmed = payload.trim()
  if (!trimmed) return null

  try {
    const json = JSON.parse(trimmed)
    return {
      temperature: parseNumeric(json.temperature ?? json.temp ?? json.t, INITIAL_READING.temperature),
      humidity: parseNumeric(json.humidity ?? json.hum ?? json.h, INITIAL_READING.humidity),
      ethylene: parseNumeric(json.ethylene ?? json.gas ?? json.ppm ?? json.e, INITIAL_READING.ethylene),
      frequency: parseNumeric(json.frequency ?? json.freq ?? json.f, INITIAL_READING.frequency),
      timestamp: Date.now(),
      source: 'bluetooth',
    }
  } catch {
    const values = Object.fromEntries(
      trimmed.split(/[,\n;]/).map((part) => {
        const [key, rawValue] = part.split(/[:=]/)
        return [key?.trim().toLowerCase(), rawValue?.trim()]
      }),
    )

    if (values.temp || values.temperature || values.hum || values.humidity || values.gas || values.ethylene) {
      return {
        temperature: parseNumeric(values.temperature ?? values.temp, INITIAL_READING.temperature),
        humidity: parseNumeric(values.humidity ?? values.hum, INITIAL_READING.humidity),
        ethylene: parseNumeric(values.ethylene ?? values.gas ?? values.ppm, INITIAL_READING.ethylene),
        frequency: parseNumeric(values.frequency ?? values.freq, INITIAL_READING.frequency),
        timestamp: Date.now(),
        source: 'bluetooth',
      }
    }
  }
  return null
}

/**
 * Enhanced simulation logic
 * Fluctuates values by max 0.1 per tick
 */
function createSimulatedReading(previous) {
  // Logic: Current Value + (Random between -0.1 and 0.1)
  const jitter = () => (Math.random() * 0.2 - 0.1);

  const next = {
    temperature: clamp(previous.temperature + jitter(), 27.0, 30.0),
    humidity: clamp(previous.humidity + jitter(), 62.0, 64.0),
    ethylene: clamp(previous.ethylene + jitter(), 180.0, 250.0),
    frequency: clamp(previous.frequency + jitter(), 49.5, 50.5), // Standard healthy grid frequency
    timestamp: Date.now(),
    source: 'simulated',
  }

  return {
    temperature: Number(next.temperature.toFixed(2)),
    humidity: Number(next.humidity.toFixed(2)),
    ethylene: Number(next.ethylene.toFixed(2)),
    frequency: Number(next.frequency.toFixed(2)),
    timestamp: next.timestamp,
    source: next.source,
  }
}

export function useStoriXaSensors(options = {}) {
  const serviceUuid = options.serviceUuid ?? DEFAULT_SERVICE_UUID
  const telemetryUuid = options.telemetryUuid ?? DEFAULT_TELEMETRY_UUID

  const deviceRef = useRef(null)
  const characteristicRef = useRef(null)
  const decoderRef = useRef(new TextDecoder('utf-8'))

  const [reading, setReading] = useState(INITIAL_READING)
  const [history, setHistory] = useState([
    { ...INITIAL_READING, time: new Date(INITIAL_READING.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ])
  const [status, setStatus] = useState('simulated')
  const [deviceName, setDeviceName] = useState('STX-001 Simulator')
  const [error, setError] = useState('')

  const bluetoothAvailable = typeof navigator !== 'undefined' && Boolean(navigator.bluetooth)

  const pushReading = useCallback((nextReading) => {
    const normalized = {
      ...nextReading,
      time: new Date(nextReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setReading(nextReading)
    setHistory((current) => [...current.slice(-35), normalized])
  }, [])

  useEffect(() => {
    if (status === 'connected') return undefined

    const id = window.setInterval(() => {
      setReading((current) => {
        const next = createSimulatedReading(current)
        setHistory((historyItems) => [
          ...historyItems.slice(-35),
          { ...next, time: new Date(next.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ])
        return next
      })
    }, 2500)

    return () => window.clearInterval(id)
  }, [status])

  const disconnect = useCallback(() => {
    const device = deviceRef.current
    if (device?.gatt?.connected) device.gatt.disconnect()
    deviceRef.current = null
    characteristicRef.current = null
    setStatus('simulated')
    setDeviceName('STX-001 Simulator')
  }, [])

  const connect = useCallback(async () => {
    setError('')
    if (!bluetoothAvailable) {
      setError('Web Bluetooth unavailable.')
      setStatus('simulated')
      return
    }

    try {
      setStatus('connecting')
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'STX' }, { namePrefix: 'StoriXa' }, { namePrefix: 'ESP32' }],
        optionalServices: [serviceUuid],
      })
      deviceRef.current = device
      setDeviceName(device.name || 'StoriXa ESP32')

      const server = await device.gatt.connect()
      const service = await server.getPrimaryService(serviceUuid)
      const characteristic = await service.getCharacteristic(telemetryUuid)
      characteristicRef.current = characteristic
      await characteristic.startNotifications()

      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const rawPayload = decoderRef.current.decode(event.target.value)
        const parsed = parseTelemetryPayload(rawPayload)
        if (parsed) pushReading(parsed)
      })

      setStatus('connected')
    } catch (e) {
      setStatus('simulated')
      setError(e.message)
    }
  }, [bluetoothAvailable, pushReading, serviceUuid, telemetryUuid])

  const analytics = useMemo(() => {
    const risk = calculateRisk(reading)
    return {
      risk, // Will be 0-5, resulting in 95-100 score (100 - risk)
      level: getRiskLevel(risk),
      shelfLife: calculateShelfLife(reading),
    }
  }, [reading])

  return {
    analytics,
    bluetoothAvailable,
    connect,
    deviceName,
    disconnect,
    error,
    history,
    reading,
    status,
  }
}