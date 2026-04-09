import { Cpu, Fan, Power, Snowflake, Zap } from 'lucide-react'
import { createElement, useState } from 'react'

const ACTUATORS = [
  {
    id: 'peltier',
    name: 'Peltier Cooler',
    detail: 'Thermal correction channel',
    Icon: Snowflake,
    autoActive: true,
  },
  {
    id: 'fan',
    name: 'Exhaust Fan',
    detail: 'Ethylene purge airflow',
    Icon: Fan,
    autoActive: true,
  },
  {
    id: 'relay',
    name: 'Relay Modules',
    detail: 'Auxiliary control bus',
    Icon: Zap,
    autoActive: false,
  },
]

function Toggle({ enabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-7 w-12 rounded-full border transition ${
        enabled ? 'border-emerald-400/70 bg-emerald-400/25' : 'border-slate-700 bg-slate-950'
      }`}
      aria-pressed={enabled}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full transition ${
          enabled ? 'left-6 bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.75)]' : 'left-1 bg-slate-500'
        }`}
      />
    </button>
  )
}

export default function Devices({ riskLevel = 'stable', telemetryStatus = 'simulated' }) {
  const [manualOverrides, setManualOverrides] = useState({
    peltier: false,
    fan: false,
    relay: false,
  })

  const isEscalated = riskLevel === 'warning' || riskLevel === 'critical'

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl shadow-black/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Device Mesh</p>
            <h2 className="mt-2 text-xl font-bold text-white">Actuator Control</h2>
            <p className="mt-1 text-sm text-slate-400">Manual override remains local until the ESP32 command channel is mapped.</p>
          </div>
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-cyan-200">
            <Cpu size={22} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {ACTUATORS.map(({ id, name, detail, Icon, autoActive }) => {
          const manual = manualOverrides[id]
          const active = manual || (autoActive && isEscalated)

          return (
            <article key={id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className={`rounded-xl p-3 ${active ? 'bg-emerald-400/15 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  {createElement(Icon, { size: 22 })}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${
                  active ? 'bg-emerald-400/15 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}
                >
                  {active ? 'Active' : 'Idle'}
                </span>
              </div>

              <h3 className="mt-4 text-base font-bold text-white">{name}</h3>
              <p className="mt-1 min-h-10 text-sm text-slate-400">{detail}</p>

              <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Override</p>
                  <p className="text-sm font-semibold text-slate-200">{manual ? 'Manual on' : 'Auto mode'}</p>
                </div>
                <Toggle
                  enabled={manual}
                  onClick={() => setManualOverrides((current) => ({ ...current, [id]: !current[id] }))}
                />
              </div>
            </article>
          )
        })}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <Power size={17} className={telemetryStatus === 'connected' ? 'text-emerald-300' : 'text-amber-300'} />
          <span>
            Control bus is {telemetryStatus === 'connected' ? 'paired with live telemetry' : 'running in simulator mode'}.
          </span>
        </div>
      </section>
    </div>
  )
}
