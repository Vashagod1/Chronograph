import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const socket = io('http://localhost:3000')

interface TelemetryData {
  speed: number
  throttle: number
  steer: number
  brake: number
  clutch: number
  gear: number
  rpm: number
  drs: number
}

const DEFAULT_TELEMETRY: TelemetryData = {
  speed: 0,
  throttle: 0,
  steer: 0,
  brake: 0,
  clutch: 0,
  gear: 0,
  rpm: 0,
  drs: 0,
}

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

function AnimatedNumber({
  value,
  digits = 0,
  suffix = '',
}: {
  value: number
  digits?: number
  suffix?: string
}) {
  const [displayValue, setDisplayValue] = useState(value)
  const previous = useRef(value)

  const formatValue = useCallback(
    (num: number) => `${num.toFixed(digits)}${suffix}`,
    [digits, suffix],
  )

  useEffect(() => {
    const startValue = previous.current
    const delta = value - startValue
    const duration = 380
    const start = performance.now()
    let frame = 0

    const tick = (timestamp: number) => {
      const progress = clamp((timestamp - start) / duration, 0, 1)
      const eased = 1 - (1 - progress) ** 3
      setDisplayValue(startValue + delta * eased)

      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        previous.current = value
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return <span>{formatValue(displayValue)}</span>
}

function GaugeDial({
  label,
  value,
  min,
  max,
  unit,
  color,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  color: string
}) {
  const percent = useMemo(() => clamp((value - min) / (max - min), 0, 1), [value, min, max])
  const angle = -130 + percent * 260

  return (
    <article className="glass-card gauge-card">
      <header>{label}</header>
      <div className="gauge" style={{ '--dial-color': color, '--dial-percent': `${percent * 100}%` } as CSSProperties}>
        <div className="gauge-track" />
        <div className="gauge-fill" />
        <div className="gauge-needle" style={{ transform: `translateX(-50%) rotate(${angle}deg)` }} />
        <div className="gauge-center">
          <AnimatedNumber value={value} digits={0} />
          <span>{unit}</span>
        </div>
      </div>
    </article>
  )
}

function RpmBar({ rpm }: { rpm: number }) {
  const totalBars = 20
  const maxRpm = 15000

  const activeBars = useMemo(() => clamp(Math.floor((rpm / maxRpm) * totalBars), 0, totalBars), [rpm])
  const isCritical = rpm > 12000

  return (
    <div className={`rpm-zone ${isCritical ? 'critical' : ''}`}>
      {Array.from({ length: totalBars }, (_, i) => (
        <span key={i} className={i < activeBars ? 'bar active' : 'bar'} />
      ))}
    </div>
  )
}

function App() {
  const [telemetry, setTelemetry] = useState<TelemetryData>(DEFAULT_TELEMETRY)

  useEffect(() => {
    const onUpdate = (data: TelemetryData) => setTelemetry(data)
    socket.on('telemetry_update', onUpdate)
    return () => {
      socket.off('telemetry_update', onUpdate)
    }
  }, [])

  const throttlePercent = useMemo(() => clamp(Math.round(telemetry.throttle * 100), 0, 100), [telemetry.throttle])
  const brakePercent = useMemo(() => clamp(Math.round(telemetry.brake * 100), 0, 100), [telemetry.brake])
  const steerPercent = useMemo(() => clamp(Math.round(((telemetry.steer + 1) / 2) * 100), 0, 100), [telemetry.steer])
  const clutchPercent = useMemo(() => clamp(Math.round(telemetry.clutch), 0, 100), [telemetry.clutch])
  const drsEnabled = telemetry.drs > 0
  const gearLabel = telemetry.gear === -1 ? 'R' : telemetry.gear === 0 ? 'N' : telemetry.gear

  return (
    <main className="dashboard">
      <header className="hero glass-card">
        <h1>F1 Telemetry Dashboard</h1>
        <p>Cybernetic race control · Live stream from car sensors</p>
      </header>

      <section className="grid">
        <article className="glass-card speed-card">
          <header>Speed</header>
          <div className="speed-value mono">
            <AnimatedNumber value={telemetry.speed} />
            <span>km/h</span>
          </div>
        </article>

        <article className="glass-card gear-card">
          <header>Gear</header>
          <div className="gear-display mono">{gearLabel}</div>
        </article>

        <article className="glass-card drs-card">
          <header>DRS</header>
          <div className={`drs-indicator ${drsEnabled ? 'active' : 'inactive'}`}>{drsEnabled ? 'OPEN' : 'CLOSED'}</div>
        </article>

        <article className="glass-card rpm-card">
          <header>RPM</header>
          <div className="rpm-value mono">
            <AnimatedNumber value={telemetry.rpm} />
          </div>
          <RpmBar rpm={telemetry.rpm} />
        </article>

        <GaugeDial label="Throttle" value={throttlePercent} min={0} max={100} unit="%" color="var(--neon-green)" />
        <GaugeDial label="Brake" value={brakePercent} min={0} max={100} unit="%" color="var(--neon-red)" />
        <GaugeDial label="Steer" value={steerPercent} min={0} max={100} unit="%" color="var(--neon-orange)" />

        <article className="glass-card telemetry-list">
          <header>Additional telemetry</header>
          <dl>
            <div>
              <dt>Throttle</dt>
              <dd className="mono">
                <AnimatedNumber value={throttlePercent} suffix="%" />
              </dd>
            </div>
            <div>
              <dt>Brake</dt>
              <dd className="mono">
                <AnimatedNumber value={brakePercent} suffix="%" />
              </dd>
            </div>
            <div>
              <dt>Steer</dt>
              <dd className="mono">
                <AnimatedNumber value={telemetry.steer} digits={2} />
              </dd>
            </div>
            <div>
              <dt>Clutch</dt>
              <dd className="mono">
                <AnimatedNumber value={clutchPercent} suffix="%" />
              </dd>
            </div>
          </dl>
        </article>
      </section>
    </main>
  )
}

export default App
