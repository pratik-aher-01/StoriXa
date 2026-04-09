import { createElement, useMemo, useState } from 'react'
import {
  Bell,
  Bluetooth,
  ChartNoAxesCombined,
  CheckCircle2,
  Droplets,
  Fan,
  Leaf,
  Power,
  Settings,
  SlidersHorizontal,
  Snowflake,
  Thermometer,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wind,
  X,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useStoriXaSensors } from './hooks/useStoriXaSensors'

const modalTitles = {
  analytics: 'Freshness Analytics',
  devices: 'Device Controls',
  alerts: 'Care Notes',
  settings: 'Connection',
}

const LEVEL_THEME = {
  stable: {
    accent: 'emerald',
    text: 'text-emerald-600',
    soft: 'bg-emerald-50',
    border: 'border-emerald-200/70',
    glow: 'shadow-emerald-500/20',
    gradient: 'from-emerald-400 via-teal-300 to-lime-300',
    dock: 'bg-emerald-950',
    status: 'Micro-climate Optimal',
    command: 'Hold current cooling profile. Conditions are protecting shelf life.',
    healthStart: 'Optimal',
    healthEnd: 'Danger',
    Icon: CheckCircle2,
  },
  warning: {
    accent: 'amber',
    text: 'text-amber-600',
    soft: 'bg-amber-50',
    border: 'border-amber-200/70',
    glow: 'shadow-amber-500/20',
    gradient: 'from-amber-400 via-orange-300 to-lime-300',
    dock: 'bg-amber-950',
    status: 'Freshness Watch',
    command: 'Increase ventilation and nudge cooling to prevent ethylene acceleration.',
    healthStart: 'Protected',
    healthEnd: 'Danger',
    Icon: TriangleAlert,
  },
  critical: {
    accent: 'rose',
    text: 'text-rose-600',
    soft: 'bg-rose-50',
    border: 'border-rose-300/80',
    glow: 'shadow-rose-500/30',
    gradient: 'from-rose-500 via-red-400 to-amber-300',
    dock: 'bg-rose-950',
    status: 'Freshness Critical',
    command: 'Start cooling and ventilation immediately. Ethylene is threatening cargo value.',
    healthStart: 'Recover',
    healthEnd: 'Danger',
    Icon: TriangleAlert,
  },
}

function todayLabel() {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date())
}

function healthLabel(level) {
  if (level === 'critical') return 'Needs Action'
  if (level === 'warning') return 'Watch'
  return 'Excellent'
}

function getTrend(history, key, decimals = 1) {
  const current = history.at(-1)?.[key] ?? 0
  const previous = history.at(-4)?.[key] ?? history.at(0)?.[key] ?? current
  const delta = current - previous

  return {
    rising: delta >= 0,
    label: `${delta >= 0 ? '+' : ''}${delta.toFixed(decimals)}`,
  }
}

function Sparkline({ data, dataKey, color }) {
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function TrendPill({ trend, tone }) {
  const Icon = trend.rising ? TrendingUp : TrendingDown

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${tone}`}>
      <Icon size={12} />
      {trend.label}
    </span>
  )
}

function SecondaryMetricCard({ color, icon, label, sparkColor, trend, unit, value, guideline, data, dataKey }) {
  const Icon = icon

  return (
    <article className="flex min-h-0 flex-col justify-between rounded-[1.65rem] border border-slate-200/50 bg-white/80 p-3 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={color}>{createElement(Icon, { size: 15, strokeWidth: 2.5 })}</span>
          <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
        </div>
        <TrendPill trend={trend} tone={trend.rising ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'} />
      </div>

      <div>
        <div className="flex items-end gap-1">
          <span className="text-[clamp(2.35rem,11vw,4.8rem)] font-black leading-none tracking-[-0.08em] text-slate-950">
            {value}
          </span>
          <span className="pb-1 text-sm font-black text-slate-500 sm:text-lg">{unit}</span>
        </div>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{guideline}</p>
        <Sparkline data={data} dataKey={dataKey} color={sparkColor} />
      </div>
    </article>
  )
}

function EthyleneHero({ reading, theme, trend }) {
  const riskCopy = reading.ethylene < 15 ? 'Ideal < 15 ppm' : reading.ethylene < 120 ? 'Ventilate above 15 ppm' : 'Purge now'

  return (
    <article className={`relative col-span-2 flex min-h-0 overflow-hidden rounded-[2rem] border ${theme.border} bg-white p-4 shadow-[0_20px_40px_rgba(0,0,0,0.08)]`}>
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full ${theme.soft} blur-2xl`} />
      <div className="relative flex w-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`rounded-2xl ${theme.soft} p-2 ${theme.text}`}>
              <Wind size={19} strokeWidth={2.6} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Ethylene Gas</p>
              <p className="text-xs font-bold text-slate-400">Silent killer monitor</p>
            </div>
          </div>
          <TrendPill trend={trend} tone={trend.rising ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'} />
        </div>

        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-end gap-1">
              <span className={`text-[clamp(4.4rem,24vw,9rem)] font-black leading-[0.82] tracking-[-0.11em] text-slate-950`}>
                {Math.round(reading.ethylene)}
              </span>
              <span className="pb-2 text-xl font-black text-slate-500">ppm</span>
            </div>
            <p className={`mt-2 text-xs font-black uppercase tracking-[0.16em] ${theme.text}`}>{riskCopy}</p>
          </div>
        </div>
      </div>
    </article>
  )
}

function AiCommandCard({ confidence, insight, theme }) {
  const Icon = theme.Icon

  return (
    <section className={`flex min-h-0 flex-[0.86] flex-col justify-between overflow-hidden rounded-[2rem] bg-slate-950 p-4 text-white shadow-[0_20px_40px_rgba(0,0,0,0.12)]`}>
      <div className="flex min-h-0 gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <span className={`absolute inset-0 rounded-2xl ${theme.soft} opacity-20 blur-md animate-pulse`} />
          <span className={theme.text}>{createElement(Icon, { size: 22, strokeWidth: 2.5 })}</span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Edge AI Command</p>
            <span className={`rounded-full ${theme.soft} px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${theme.text}`}>
              Live
            </span>
          </div>
          <h2 className="mt-1 text-[clamp(1.1rem,4.6vw,2rem)] font-black leading-tight tracking-[-0.04em]">
            {theme.status}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-300">{insight}</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-300">
          <span>{theme.healthStart}</span>
          <span>{confidence}%</span>
          <span>{theme.healthEnd}</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10">
          <div
            className={`h-2.5 rounded-full bg-gradient-to-r ${theme.gradient} shadow-[0_0_20px_rgba(16,185,129,0.9)] transition-all duration-700`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </section>
  )
}

function OverlayModal({ children, mode, onClose, theme }) {
  if (!mode) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-3 backdrop-blur-sm sm:items-center">
      <section className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.24em] ${theme.text}`}>StoriXa</p>
            <h2 className="text-lg font-black text-slate-950">{modalTitles[mode]}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white shadow-md shadow-slate-900/15"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden p-4">{children}</div>
      </section>
    </div>
  )
}

function ToggleRow({ icon, label, detail, enabled, onToggle, theme }) {
  const Icon = icon

  return (
    <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/5">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${theme.soft} ${theme.text}`}>
          {createElement(Icon, { size: 20 })}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">{label}</p>
          <p className="truncate text-xs font-medium text-slate-500">{detail}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? theme.dock : 'bg-slate-200'}`}
        aria-pressed={enabled}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            enabled ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}

function DevicesPanel({ level, theme }) {
  const [toggles, setToggles] = useState({
    cooler: level !== 'stable',
    fan: level === 'critical',
    relay: false,
  })

  const setToggle = (key) => {
    setToggles((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <div className="grid h-full content-center gap-2 sm:grid-cols-3">
      <ToggleRow
        icon={Snowflake}
        label="Peltier Cooler"
        detail="Keeps produce calm"
        enabled={toggles.cooler}
        onToggle={() => setToggle('cooler')}
        theme={theme}
      />
      <ToggleRow
        icon={Fan}
        label="Exhaust Fan"
        detail="Clears ethylene buildup"
        enabled={toggles.fan}
        onToggle={() => setToggle('fan')}
        theme={theme}
      />
      <ToggleRow
        icon={Power}
        label="Relay"
        detail="Auxiliary module"
        enabled={toggles.relay}
        onToggle={() => setToggle('relay')}
        theme={theme}
      />
    </div>
  )
}

function AnalyticsPanel({ history, theme }) {
  return (
    <div className="flex h-[56vh] max-h-[410px] min-h-[270px] flex-col rounded-3xl border border-slate-200 bg-white p-3 shadow-md shadow-slate-900/5">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <div>
          <p className="text-sm font-black text-slate-950">Freshness trend</p>
          <p className="text-xs font-medium text-slate-500">Temperature, humidity, and ethylene</p>
        </div>
        <span className={`rounded-full ${theme.soft} px-3 py-1 text-[10px] font-black uppercase tracking-widest ${theme.text}`}>Live</span>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="ethyleneFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.10)',
              }}
            />
            <Area type="monotone" dataKey="ethylene" name="Ethylene" stroke="#059669" strokeWidth={4} fill="url(#ethyleneFill)" dot={false} />
            <Line type="monotone" dataKey="temperature" name="Temp" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="humidity" name="Humidity" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function AlertsPanel({ level, message, theme }) {
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <div className={`rounded-3xl border ${theme.border} bg-white p-4 shadow-md shadow-slate-900/5`}>
        <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${theme.text}`}>Current care note</p>
        <h3 className="mt-2 text-2xl font-black text-slate-950">{healthLabel(level)}</h3>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{message}</p>
      </div>
      <div className={`rounded-3xl border ${theme.border} ${theme.soft} p-4 shadow-sm shadow-slate-900/5`}>
        <p className="font-black text-slate-950">Command</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{theme.command}</p>
      </div>
    </div>
  )
}

function SettingsPanel({ bluetoothAvailable, connect, deviceName, disconnect, status, theme }) {
  const connected = status === 'connected'

  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-900/5">
        <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${theme.text}`}>Container link</p>
        <h3 className="mt-2 text-2xl font-black text-slate-950">{deviceName}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {bluetoothAvailable ? 'Connect to the ESP32 sensor node when the container is nearby.' : 'Web Bluetooth is not available in this browser.'}
        </p>
        <button
          type="button"
          onClick={connected ? disconnect : connect}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl ${theme.dock} px-5 py-3 font-black text-white shadow-md shadow-slate-900/15`}
        >
          <Bluetooth size={18} />
          {connected ? 'Disconnect ESP32' : 'Connect ESP32'}
        </button>
      </div>
    </div>
  )
}

function QuickDock({ activeModal, onOpen }) {
  const actions = [
    { mode: 'analytics', icon: ChartNoAxesCombined, label: 'Analytics' },
    { mode: 'devices', icon: SlidersHorizontal, label: 'Devices' },
    { mode: 'alerts', icon: Bell, label: 'Alerts' },
    { mode: 'settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <nav className="absolute bottom-3 left-1/2 z-30 flex w-[min(92vw,430px)] -translate-x-1/2 items-center justify-between rounded-full border border-slate-200 bg-white/95 p-1.5 shadow-lg shadow-slate-900/10 backdrop-blur-md">
      {actions.map(({ mode, icon: Icon, label }) => {
        const active = activeModal === mode

        return (
          <button
            key={mode}
            type="button"
            onClick={() => onOpen(mode)}
            className={`flex h-11 flex-1 items-center justify-center rounded-full transition-all duration-200 ${
              active ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20' : 'text-slate-400 hover:scale-110 hover:text-slate-900'
            }`}
            aria-label={label}
          >
            {createElement(Icon, { size: 20, strokeWidth: 2.4 })}
          </button>
        )
      })}
    </nav>
  )
}

export default function App() {
  const [activeModal, setActiveModal] = useState(null)
  const {
    analytics,
    bluetoothAvailable,
    connect,
    deviceName,
    disconnect,
    history,
    reading,
    status,
  } = useStoriXaSensors()

  const theme = LEVEL_THEME[analytics.level]
  const confidence = Math.max(8, 100 - analytics.risk)
  const temperatureTrend = getTrend(history, 'temperature', 1)
  const humidityTrend = getTrend(history, 'humidity', 0)
  const ethyleneTrend = getTrend(history, 'ethylene', 1)

  const insight = useMemo(() => {
    if (analytics.level === 'critical') {
      return 'Start cooling and ventilation immediately.'
    }

    if (analytics.level === 'warning') {
      return 'Ventilate for 12 minutes and lower chamber temperature by 2C.'
    }

    return 'Perfect conditions maintained. Keep the current profile active.'
  }, [analytics.level])

  const modalContent = {
    analytics: <AnalyticsPanel history={history} theme={theme} />,
    devices: <DevicesPanel level={analytics.level} theme={theme} />,
    alerts: <AlertsPanel level={analytics.level} message={insight} theme={theme} />,
    settings: (
      <SettingsPanel
        bluetoothAvailable={bluetoothAvailable}
        connect={connect}
        deviceName={deviceName}
        disconnect={disconnect}
        status={status}
        theme={theme}
      />
    ),
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-50 p-3 text-slate-950 sm:p-5">
      <div className="mx-auto flex h-full max-w-5xl flex-col gap-2.5 pb-16 sm:gap-3">
        <header className="flex shrink-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-xs font-black uppercase tracking-[0.18em] ${theme.text}`}>Good day, Grower</p>
            <h1 className="truncate text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">StoriXa</h1>
            <p className="text-xs font-semibold text-slate-500 sm:text-sm">{todayLabel()}</p>
          </div>
          <div className={`shrink-0 rounded-2xl border ${theme.border} bg-white px-3 py-2 text-right shadow-sm`}>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Status</p>
            <p className={`text-sm font-black sm:text-base ${theme.text}`}>{healthLabel(analytics.level)}</p>
          </div>
        </header>

        <section className="grid min-h-0 flex-[1.28] grid-cols-2 grid-rows-[1.35fr_1fr] gap-2.5 sm:gap-3">
          <EthyleneHero reading={reading} theme={theme} trend={ethyleneTrend} />
          <SecondaryMetricCard
            icon={Thermometer}
            label="Temp"
            value={Math.round(reading.temperature)}
            unit="C"
            color="text-amber-500"
            sparkColor="#f59e0b"
            guideline="Ideal 2-8C"
            trend={temperatureTrend}
            data={history}
            dataKey="temperature"
          />
          <SecondaryMetricCard
            icon={Droplets}
            label="Humidity"
            value={Math.round(reading.humidity)}
            unit="%"
            color="text-sky-500"
            sparkColor="#0ea5e9"
            guideline="Target 70-85%"
            trend={humidityTrend}
            data={history}
            dataKey="humidity"
          />
        </section>

        <AiCommandCard confidence={confidence} insight={insight} theme={theme} />

        <section className="grid shrink-0 grid-cols-3 gap-2.5">
          <div className="rounded-3xl border border-slate-200/50 bg-white/80 p-3 shadow-sm backdrop-blur-xl">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Freshness</p>
            <p className="mt-1 text-lg font-black tracking-tight text-slate-950">+{analytics.shelfLife.extensionDays}d</p>
          </div>
          <div className="rounded-3xl border border-slate-200/50 bg-white/80 p-3 shadow-sm backdrop-blur-xl">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Waste Cut</p>
            <p className="mt-1 text-lg font-black tracking-tight text-slate-950">{analytics.shelfLife.wasteReduction}%</p>
          </div>
          <div className="rounded-3xl border border-slate-200/50 bg-white/80 p-3 shadow-sm backdrop-blur-xl">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Mode</p>
            <p className="mt-1 truncate text-lg font-black tracking-tight text-slate-950">{status === 'connected' ? 'Live' : 'Demo'}</p>
          </div>
        </section>
      </div>

      <QuickDock activeModal={activeModal} onOpen={setActiveModal} />

      <OverlayModal mode={activeModal} onClose={() => setActiveModal(null)} theme={theme}>
        {modalContent[activeModal]}
      </OverlayModal>
    </main>
  )
}
