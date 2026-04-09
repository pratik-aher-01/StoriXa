import { createElement, useState } from 'react'
import {
  Activity, Bell, Bluetooth, ChartNoAxesCombined, CheckCircle2, Droplets,
  Fan, Power, Settings, SlidersHorizontal, Snowflake,
  Thermometer, TriangleAlert, Wind, X, Zap
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, Line, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts'
import { useStoriXaSensors } from './hooks/useStoriXaSensors'

const modalTitles = {
  analytics: 'Environmental Analytics',
  devices: 'Active Edge Controls',
  alerts: 'System Intelligence',
  settings: 'Hardware Link',
}

const LEVEL_THEME = {
  stable: {
    accent: 'emerald',
    text: 'text-emerald-600',
    bgGlow: 'bg-emerald-300',
    soft: 'bg-emerald-500/10',
    border: 'border-emerald-200/50',
    stroke: 'stroke-emerald-500',
    gradient: 'from-emerald-400 via-teal-400 to-emerald-500',
    dock: 'bg-emerald-950',
    status: 'Micro-climate Optimal',
    command: 'Holding current thermal profile. Cellular degradation halted.',
    Icon: CheckCircle2,
  },
  warning: {
    accent: 'amber',
    text: 'text-amber-600',
    bgGlow: 'bg-amber-300',
    soft: 'bg-amber-500/10',
    border: 'border-amber-200/50',
    stroke: 'stroke-amber-500',
    gradient: 'from-amber-400 via-orange-400 to-amber-500',
    dock: 'bg-amber-950',
    status: 'Freshness Watch',
    command: 'Nudging ventilation protocols to offset ethylene acceleration.',
    Icon: TriangleAlert,
  },
  critical: {
    accent: 'rose',
    text: 'text-rose-600',
    bgGlow: 'bg-rose-400',
    soft: 'bg-rose-500/10',
    border: 'border-rose-300/50',
    stroke: 'stroke-rose-500',
    gradient: 'from-rose-500 via-red-500 to-rose-600',
    dock: 'bg-rose-950',
    status: 'Freshness Critical',
    command: 'Executing maximum purge. Ethylene saturation threatening cargo.',
    Icon: Zap,
  },
}

function healthLabel(level) {
  if (level === 'critical') return 'Needs Action'
  if (level === 'warning') return 'Watch'
  return 'Excellent'
}

// --- ULTRA-PREMIUM COMPONENTS ---

function CircularHealthGauge({ risk, theme }) {
  const score = Math.max(0, 100 - (Number(risk) || 0));
  const radius = 75;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <article className="relative flex flex-col items-center justify-center rounded-[2.5rem] border border-white/60 bg-white/40 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-2xl overflow-hidden group shrink-0">
      {risk >= 76 && <div className="absolute inset-0 rounded-[2.5rem] bg-rose-500/10 blur-3xl animate-pulse" />}
      
      <div className="flex items-center gap-2 mb-4 z-10">
        <Zap size={14} className="text-slate-400" />
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">StoriXa Core</p>
      </div>
      
      <div className="relative flex items-center justify-center z-10 transition-transform duration-700 hover:scale-105">
        <svg className="w-52 h-52 transform -rotate-90 drop-shadow-xl">
          <circle cx="104" cy="104" r={radius} className="stroke-slate-200/50 fill-none" strokeWidth="16" />
          <circle cx="104" cy="104" r={radius - 12} className="stroke-slate-300/30 fill-none" strokeWidth="1" strokeDasharray="4 4" />
          <circle 
            cx="104" cy="104" r={radius} 
            className={`fill-none transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] ${theme.stroke}`} 
            strokeWidth="16" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
            strokeLinecap="round" 
          />
        </svg>
        
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-6xl font-black tracking-tighter ${theme.text} transition-all duration-1000 drop-shadow-sm`}>
            {score}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Health</span>
        </div>
      </div>
    </article>
  )
}

function MiniMetric({ label, value, unit, detail, icon: Icon, theme }) {
  const detailCopy = detail ?? {
    Gas: 'Gas concentration inside the storage chamber.',
    Temp: 'Cooling state across the produce micro-climate.',
    Hum: 'Moisture balance that protects freshness.',
  }[label] ?? 'Live environmental reading.'

  return (
    <article className="group rounded-[1.8rem] border border-white/70 bg-white/55 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/75">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] ${theme.soft}`}>
        {createElement(Icon, { size: 18, className: theme.text, strokeWidth: 2.5 })}
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      </div>

      <div className="mt-5 flex items-end gap-1">
        <span className="text-3xl font-black tracking-[-0.05em] text-slate-800">{value}</span>
        <span className="pb-1 text-sm font-black text-slate-400">{unit}</span>
      </div>

      <p className="mt-2 text-sm font-bold leading-5 text-slate-600">{detailCopy}</p>
    </article>
  )
}

function AiCommandCard({ confidence, insight, theme }) {
  const CardIcon = theme.Icon

  return (
    <section className="relative shrink-0 rounded-[2.5rem] bg-slate-900 p-6 text-white shadow-[0_20px_40px_rgba(0,0,0,0.2)] overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[gradient_3s_linear_infinite]" />

      {/* Changed to strict vertical stack to prevent overlaps */}
      <div className="relative z-10 flex flex-col gap-4">
        
        {/* Top Header Row */}
        <div className="flex gap-4 items-center">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-inner">
            <span className={`absolute inset-0 rounded-2xl ${theme.soft} opacity-40 blur-xl animate-pulse`} />
            <CardIcon size={26} strokeWidth={2.5} className={theme.text} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400" />
              Edge AI Live
            </div>
            <h2 className="text-[1.35rem] font-black leading-tight tracking-tight text-white drop-shadow-md">
              {theme.status}
            </h2>
          </div>
        </div>

        {/* Message Panel */}
        <p className="text-sm font-medium leading-relaxed text-slate-300 bg-white/5 p-4 rounded-2xl border border-white/5">
          {insight}
        </p>

        {/* Bottom Progress Bar */}
        <div className="mt-1">
          <div className="mb-2 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Optimal</span>
            <span className={`px-2 py-0.5 rounded-full bg-white/10 ${theme.text}`}>Confidence {confidence}%</span>
            <span>Critical</span>
          </div>
          <div className="h-3 rounded-full bg-black/40 overflow-hidden shadow-inner p-0.5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${theme.gradient} transition-all duration-1000 ease-out`}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// --- MODALS & PANELS ---

function OverlayModal({ children, mode, onClose, theme }) {
  if (!mode) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <section className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/60 bg-white/80 shadow-[0_-20px_60px_rgba(0,0,0,0.1)] backdrop-blur-3xl">
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 sm:hidden" />
        <header className="flex shrink-0 items-center justify-between px-6 py-5 border-b border-white/40">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.text}`}>System Interface</p>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{modalTitles[mode]}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-transform hover:scale-105 hover:bg-slate-50 border border-slate-100">
            <X size={20} strokeWidth={2.5} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-6 scrollbar-hide">{children}</div>
      </section>
    </div>
  )
}

function AnalyticsPanel({ history }) {
  return (
    <div className="flex h-[60vh] max-h-[500px] min-h-[300px] flex-col rounded-[2rem] border border-white/60 bg-white/50 p-5 shadow-sm backdrop-blur-xl">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <div>
          <p className="text-lg font-black text-slate-800 tracking-tight">Telemetry Stream</p>
          <p className="text-xs font-semibold text-slate-500">Real-time internal atmospheric data</p>
        </div>
      </div>
      <div className="min-h-0 flex-1 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#cbd5e1" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} dy={10} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} dx={-10} />
            <Tooltip />
            <Area type="monotone" dataKey="ethylene" name="Ethylene (ppm)" stroke="#059669" strokeWidth={3} fill="url(#colorEth)" />
            <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f59e0b" strokeWidth={3} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const ACTUATORS = {
  cooler: {
    id: 'cooler',
    label: 'Peltier Cooling Array',
    detail: 'Thermoelectric climate control',
    icon: Snowflake,
  },
  fan: {
    id: 'fan',
    label: 'Exhaust Ventilation',
    detail: 'Ethylene & heat purge system',
    icon: Fan,
  },
  relay: {
    id: 'relay',
    label: 'Auxiliary Relay',
    detail: 'Expansion module power',
    icon: Power,
  },
}

function ToggleRow({
  icon: Icon,
  label,
  detail,
  enabled,
  isExpanded,
  intensity,
  onToggle,
  onSelect,
  onIntensityChange,
  theme,
}) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[2rem] border transition-all duration-300 ${
        enabled ? 'border-white/60 bg-white/50 shadow-sm' : 'border-white/40 bg-white/30 opacity-75'
      } ${isExpanded ? 'scale-[1.01] bg-white/85 ring-2 ring-slate-300/40' : ''}`}
    >
      <div
        role={enabled ? 'button' : undefined}
        tabIndex={enabled ? 0 : -1}
        onClick={() => enabled && onSelect()}
        onKeyDown={(event) => {
          if (!enabled) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect()
          }
        }}
        className={`group flex items-center justify-between gap-4 p-4 transition-colors ${
          enabled ? 'cursor-pointer hover:bg-white/80' : ''
        }`}
      >
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] transition-colors duration-500 ${
              enabled ? `${theme.soft} ${theme.text}` : 'bg-slate-100 text-slate-400'
            }`}
          >
            {createElement(Icon, { size: 22, strokeWidth: 2.5 })}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-black text-slate-800">{label}</p>
            <p className={`truncate text-xs font-semibold ${enabled ? theme.text : 'text-slate-500'}`}>
              {enabled ? (isExpanded ? 'Control panel open' : 'Active - tap to adjust') : detail}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onToggle()
          }}
          className={`relative h-8 w-14 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 ${
            enabled ? theme.dock : 'bg-slate-200'
          }`}
          aria-pressed={enabled}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ${
              enabled ? 'left-6.5' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {enabled && isExpanded && (
        <div className="px-5 pb-5 pt-1">
          <div className="rounded-[1.6rem] border border-white/70 bg-slate-100/80 p-4 shadow-inner">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Output level</p>
              <p className="text-lg font-black text-slate-800">{intensity}%</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500">1%</span>
              <input
                type="range"
                min="1"
                max="100"
                value={intensity}
                onChange={(event) => onIntensityChange(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-300"
                style={{ accentColor: '#0f172a' }}
              />
              <span className="text-xs font-bold text-slate-500">100%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DevicesPanel({ level, theme }) {
  const [toggles, setToggles] = useState({ cooler: level !== 'stable', fan: level === 'critical', relay: false })
  const [intensities, setIntensities] = useState({ cooler: 80, fan: 100, relay: 100 })
  const [activeTuner, setActiveTuner] = useState(null)

  const setToggle = (key) => {
    setToggles((current) => {
      const nextEnabled = !current[key]
      if (!nextEnabled && activeTuner === key) {
        setActiveTuner(null)
      }
      return { ...current, [key]: nextEnabled }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {Object.values(ACTUATORS).map((actuator) => (
        <ToggleRow
          key={actuator.id}
          icon={actuator.icon}
          label={actuator.label}
          detail={actuator.detail}
          enabled={toggles[actuator.id]}
          isExpanded={activeTuner === actuator.id}
          intensity={intensities[actuator.id]}
          onToggle={() => setToggle(actuator.id)}
          onSelect={() => setActiveTuner((current) => (current === actuator.id ? null : actuator.id))}
          onIntensityChange={(value) => {
            setIntensities((current) => ({ ...current, [actuator.id]: value }))
          }}
          theme={theme}
        />
      ))}
    </div>
  )
}

function AlertsPanel({ level, message, theme }) {
  return (
    <div className="flex flex-col justify-center gap-3">
      <div className={`rounded-[2rem] border ${theme.border} bg-white/60 p-6 shadow-sm backdrop-blur-xl`}>
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.text}`}>System Directive</p>
        <h3 className="mt-2 text-2xl font-black text-slate-800">{healthLabel(level)}</h3>
        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{message}</p>
      </div>
    </div>
  )
}

function SettingsPanel({
  bluetoothAvailable,
  connect,
  deviceName,
  disconnect,
  status,
  theme,
  overrideMode,
  setOverrideMode,
}) {
  const connected = status === 'connected'

  return (
    <div className="flex flex-col justify-center gap-4">

      {/* 🔌 Hardware Section */}
      <div className="rounded-[2rem] border border-white/60 bg-white/60 p-6 shadow-sm backdrop-blur-xl">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme?.text}`}>
          Hardware Link
        </p>

        <h3 className="mt-2 text-2xl font-black text-slate-800">
          {deviceName}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {bluetoothAvailable
            ? 'Connect to ESP32 for real-time Edge AI monitoring.'
            : 'Web Bluetooth not supported in this browser.'}
        </p>

        <button
          type="button"
          onClick={connected ? disconnect : connect}
          className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full ${
            theme?.dock || 'bg-slate-900'
          } px-6 py-4 font-black text-white shadow-lg transition hover:scale-[1.02] active:scale-95`}
        >
          <Bluetooth size={20} />
          {connected ? 'Disconnect ESP32 Node' : 'Connect ESP32 Node'}
        </button>
      </div>

      {/* 🧠 Simulation Override Section */}
      <div className="rounded-[2rem] border border-white/60 bg-white/60 p-6 shadow-sm backdrop-blur-xl">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
          Simulation Mode
        </p>

        <h3 className="mt-2 text-lg font-black text-slate-800">
          Override Sensor Data
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Force system into specific environmental conditions for testing.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">

          {['healthy', 'moderate', 'critical'].map((mode) => {
            const isActive = overrideMode === mode

            return (
              <button
                key={mode}
                onClick={() => setOverrideMode(mode)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-white/40 text-slate-700 hover:bg-white/70'
                }`}
              >
                {mode}
              </button>
            )
          })}

          {/* Reset Button */}
          <button
            onClick={() => setOverrideMode(null)}
            className="px-4 py-2 rounded-full text-sm font-bold bg-rose-500 text-white shadow-md hover:scale-105 transition"
          >
            Reset
          </button>

        </div>

        {/* Status Indicator */}
        <div className="mt-4 text-sm text-slate-600">
          Current Mode:{' '}
          <span className="font-bold">
            {overrideMode ? overrideMode.toUpperCase() : 'AUTO'}
          </span>
        </div>
      </div>

    </div>
  )
}
// --- MAIN LAYOUT ---

export default function App() {
  const [activeModal, setActiveModal] = useState(null)
  const {
    analytics,
    bluetoothAvailable,
    connect,
    deviceName,
    disconnect,
    history,
    overrideMode,
    reading,
    setOverrideMode,
    status,
  } = useStoriXaSensors()

  const theme = LEVEL_THEME[analytics.level] || LEVEL_THEME.stable
  const confidence = Math.max(12, 100 - (Number(analytics.risk) || 0))
  const HeaderIcon = theme.Icon
  const readingTimestamp = reading.timestamp ?? 0
  const recentItems = history.slice(-5)
  const recentGaps = recentItems
    .slice(1)
    .map((item, index) => item.timestamp - recentItems[index].timestamp)
    .filter((gap) => gap > 0)
  const averageGap = recentGaps.length > 0
    ? recentGaps.reduce((total, gap) => total + gap, 0) / recentGaps.length
    : 2500
  const sampleRateHz = (1000 / averageGap).toFixed(1)

  // Format date and time dynamically from the sensor reading
  const dateStr = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(readingTimestamp)
  const timeStr = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(readingTimestamp)

  return (
    <main className="relative min-h-screen w-screen overflow-x-hidden overflow-y-auto bg-slate-50 text-slate-900 selection:bg-teal-500/30">
      
      {/* Dynamic Ambient Background Mesh */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[100px] opacity-30 transition-colors duration-[3000ms] ease-in-out ${theme.bgGlow}`} />
        <div className={`absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-20 transition-colors duration-[3000ms] ease-in-out ${theme.bgGlow}`} />
      </div>

      {/* Increased pb-36 guarantees the bottom cards are not covered by the dock */}
      <div className="relative z-10 mx-auto flex min-h-full max-w-5xl flex-col gap-4 p-4 sm:p-6 pb-36">
        
        {/* Restructured Header */}
        <header className="flex flex-col gap-3 py-2 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex flex-col">
              <h1 className="truncate text-4xl font-black tracking-[-0.05em] text-slate-800">StoriXa</h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Dashboard</p>
            </div>
            
            <div className="shrink-0 flex items-center gap-3 rounded-[1.5rem] border border-white/60 bg-white/50 pl-4 pr-2 py-2 shadow-sm backdrop-blur-xl">
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Condition</p>
                <p className={`text-sm font-black transition-colors duration-1000 ${theme.text}`}>{healthLabel(analytics.level)}</p>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme.soft}`}>
                <HeaderIcon size={16} className={theme.text} strokeWidth={3} />
              </div>
            </div>
          </div>

          {/* Rounded Block Date/Time Pill */}
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-200/50 px-4 py-2 backdrop-blur-md border border-white/40 shadow-sm">
            <span className="text-xs font-black text-slate-700">{dateStr}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span className="text-xs font-bold text-slate-600">{timeStr}</span>
          </div>
        </header>

        {/* Primary Data Zone */}
        <div className="flex flex-col gap-3 sm:gap-4 mt-2">
          <CircularHealthGauge risk={analytics.risk} theme={theme} />
          
          <div className="grid grid-cols-2 gap-3">
            <MiniMetric
              label="Ethylene"
              value={Math.round(Number(reading?.ethylene) || 0)}
              unit="ppm"
              detail="Gas concentration inside the storage chamber."
              icon={Wind}
              theme={theme}
            />
            <MiniMetric label="Temp" value={Number(reading?.temperature || 0).toFixed(1)} unit="°C" icon={Thermometer} theme={theme} />
            <MiniMetric
              label="Humidity"
              value={Math.round(Number(reading?.humidity) || 0)}
              unit="%"
              detail="Moisture balance that protects freshness."
              icon={Droplets}
              theme={theme}
            />
            <MiniMetric
              label="Frequency"
              value={sampleRateHz}
              unit="Hz"
              detail={status === 'connected' ? 'Live telemetry refresh from the sensor node.' : 'Simulator update cadence for testing.'}
              icon={Activity}
              theme={theme}
            />
          </div>
        </div>

        {/* Edge AI Action Card */}
        <AiCommandCard confidence={confidence} insight={theme.command} theme={theme} />

        {/* Secondary Stats */}
        <section className="grid shrink-0 grid-cols-3 gap-3">
          <div className="rounded-[1.5rem] border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-xl text-center shrink-0">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">Life Ext</p>
            <p className="mt-1 text-xl font-black tracking-tight text-slate-800">+{analytics.shelfLife.extensionDays}d</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-xl text-center shrink-0">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">Waste Cut</p>
            <p className="mt-1 text-xl font-black tracking-tight text-slate-800">{analytics.shelfLife.wasteReduction}%</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-xl text-center shrink-0">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">Mode</p>
            <p className="mt-1 text-lg font-black tracking-tight text-slate-800">{status === 'connected' ? 'Hardware' : 'Demo'}</p>
          </div>
        </section>
      </div>

      {/* Floating Bottom Dock */}
      <nav className="fixed bottom-6 left-1/2 z-30 flex w-[min(90vw,400px)] -translate-x-1/2 items-center justify-between rounded-full border border-white/40 bg-white/60 p-2 shadow-[0_20px_40px_rgba(0,0,0,0.1)] backdrop-blur-2xl">
        {[
          { mode: 'analytics', icon: ChartNoAxesCombined, label: 'Analytics' },
          { mode: 'devices', icon: SlidersHorizontal, label: 'Devices' },
          { mode: 'alerts', icon: Bell, label: 'Alerts' },
          { mode: 'settings', icon: Settings, label: 'Settings' },
        ].map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            type="button"
            aria-label={label}
            onClick={() => setActiveModal(mode)}
            className={`flex h-12 flex-1 items-center justify-center rounded-full transition-all duration-300 ${
              activeModal === mode ? 'bg-slate-800 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
            }`}
          >
            {createElement(Icon, { size: 22, strokeWidth: activeModal === mode ? 2.5 : 2 })}
          </button>
        ))}
      </nav>

      <OverlayModal mode={activeModal} onClose={() => setActiveModal(null)} theme={theme}>
        {activeModal === 'analytics' && <AnalyticsPanel history={history} />}
        {activeModal === 'devices' && <DevicesPanel level={analytics.level} theme={theme} />}
        {activeModal === 'alerts' && <AlertsPanel level={analytics.level} message={theme.command} theme={theme} />}
        {activeModal === 'settings' && (
          <SettingsPanel
            bluetoothAvailable={bluetoothAvailable}
            connect={connect}
            deviceName={deviceName}
            disconnect={disconnect}
            status={status}
            theme={theme}
            overrideMode={overrideMode}
            setOverrideMode={setOverrideMode}
          />
        )}
      </OverlayModal>
    </main>
  )
}
