import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb'
const DEFAULT_TELEMETRY_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb'

const INITIAL_READING = {
  temperature: 18.4,
  humidity: 54,
  ethylene: 92,
  timestamp: Date.now(),
  source: 'simulated',
}

// --- BACKUP PRESETS ---
// These provide a reliable fallback for UI demos or connection failures
const BACKUP_PRESETS = {
  healthy: { temperature: 14.2, humidity: 48, ethylene: 45, label: 'Backup: Healthy' },
  moderate: { temperature: 24.5, humidity: 62, ethylene: 280, label: 'Backup: Moderate' },
  critical: { temperature: 36.8, humidity: 88, ethylene: 650, label: 'Backup: Critical' },
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function parseNumeric(value, fallback = 0) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function calculateRisk(reading) {
  const tempRisk = clamp((reading.temperature - 4) / 32, 0, 1) * 38
  const humidityRisk = clamp((reading.humidity - 55) / 40, 0, 1) * 24
  const ethyleneRisk = clamp(reading.ethylene / 700, 0, 1) * 38

  return Math.round(clamp(tempRisk + humidityRisk + ethyleneRisk, 4, 99))
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
        timestamp: Date.now(),
        source: 'bluetooth',
      }
    }
  }
  return null
}

function createSimulatedReading(previous) {
  const next = {
    temperature: clamp(previous.temperature + Math.random() * 0.8 - 0.25, 12, 39),
    humidity: clamp(previous.humidity + Math.random() * 3 - 1.1, 42, 92),
    ethylene: clamp(previous.ethylene + Math.random() * 18 - 4, 40, 620),
    timestamp: Date.now(),
    source: 'simulated',
  }

  return {
    temperature: Number(next.temperature.toFixed(1)),
    humidity: Math.round(next.humidity),
    ethylene: Math.round(next.ethylene),
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
  const [overrideMode, setOverrideMode] = useState(null) // 'healthy' | 'moderate' | 'critical' | null
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

  // Main Simulation/Backup Effect
  useEffect(() => {
    if (status === 'connected') return undefined

    const id = window.setInterval(() => {
      setReading((current) => {
        let next;
        
        if (overrideMode && BACKUP_PRESETS[overrideMode]) {
          // Add small random jitter so the graph looks "live" even in backup mode
          const preset = BACKUP_PRESETS[overrideMode];
          next = {
            temperature: Number((preset.temperature + (Math.random() * 0.4 - 0.2)).toFixed(1)),
            humidity: Math.round(preset.humidity + (Math.random() * 2 - 1)),
            ethylene: Math.round(preset.ethylene + (Math.random() * 10 - 5)),
            timestamp: Date.now(),
            source: 'backup-mode'
          };
        } else {
          next = createSimulatedReading(current);
        }

        const historyItem = { 
          ...next, 
          time: new Date(next.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        
        setHistory((prev) => [...prev.slice(-35), historyItem]);
        return next;
      });
    }, 2500);

    return () => window.clearInterval(id);
  }, [status, overrideMode]);

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
    if (!bluetoothAvailable) return
    try {
      setStatus('connecting')
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'STX' }, { namePrefix: 'StoriXa' }, { namePrefix: 'ESP32' }],
        optionalServices: [serviceUuid],
      })
      deviceRef.current = device
      setDeviceName(device.name || 'StoriXa ESP32')

      device.addEventListener('gattserverdisconnected', () => {
        setStatus('simulated')
        setDeviceName('STX-001 Simulator')
      })

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
    } catch (err) {
      setStatus('simulated')
      setError(err.message)
    }
  }, [bluetoothAvailable, pushReading, serviceUuid, telemetryUuid])

  const analytics = useMemo(() => {
    const risk = calculateRisk(reading)
    return {
      risk,
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
    overrideMode,
    setOverrideMode // Exported to be used in SettingsPanel
  }
}