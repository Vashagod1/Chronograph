import { useEffect, useState, useMemo } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:3000");

// ─── Types ───────────────────────────────────────────
interface TelemetryData {
    speed: number;
    throttle: number;
    steer: number;
    brake: number;
    clutch: number;
    gear: number;
    rpm: number;
    drs: number;
}

interface LapData {
    currentLapTimeInMS: number;
    carPosition: number;
    currentLapNum: number;
}

// ─── Utils ───────────────────────────────────────────
const formatTime = (ms: number): string => {
    if (!ms || ms < 0) return "00:00.000";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
};

const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

// ─── Sub-Components ──────────────────────────────────

function RpmBar({ rpm }: { rpm: number }) {
    const TOTAL_BARS = 20;
    const MAX_RPM = 15000;

    const activeBars = useMemo(
        () => clamp(Math.floor((rpm / MAX_RPM) * TOTAL_BARS), 0, TOTAL_BARS),
        [rpm]
    );

    return (
        <div className="rpm-container">
            <div className="rpm-label">RPM × 1000</div>
            <div className="rpm-scale">
                <span>0</span>
                <span>5</span>
                <span>10</span>
                <span>15</span>
            </div>
            <div className="rpm-bar">
                {Array.from({ length: TOTAL_BARS }).map((_, i) => {
                    const isActive = i < activeBars;
                    let segmentClass = "rpm-segment";
                    if (isActive) {
                        if (i < 12) segmentClass += " rpm-green";
                        else if (i < 17) segmentClass += " rpm-yellow";
                        else segmentClass += " rpm-red";
                    }
                    return <div key={i} className={segmentClass} />;
                })}
            </div>
        </div>
    );
}

function PedalCluster({
                          throttle,
                          brake,
                          clutch,
                      }: {
    throttle: number;
    brake: number;
    clutch: number;
}) {
    return (
        <div className="pedal-cluster">
            <Pedal label="THROTTLE" value={throttle} color="#00ff88" />
            <Pedal label="BRAKE" value={brake} color="#ff3333" />
            <Pedal label="CLUTCH" value={clutch} color="#ffaa00" />
        </div>
    );
}

function Pedal({
                   label,
                   value,
                   color,
               }: {
    label: string;
    value: number;
    color: string;
}) {
    const pct = clamp((value || 0) * 100, 0, 100);
    return (
        <div className="pedal">
            <div className="pedal-track">
                <div
                    className="pedal-fill"
                    style={{ height: `${pct}%`, backgroundColor: color }}
                />
            </div>
            <div className="pedal-info">
                <span className="pedal-name">{label}</span>
                <span className="pedal-pct">{pct.toFixed(0)}%</span>
            </div>
        </div>
    );
}

function SteeringIndicator({ steer }: { steer: number }) {
    const val = clamp(steer || 0, -1, 1);
    const pct = Math.abs(val) * 100;
    const isLeft = val < 0;

    return (
        <div className="steering">
            <div className="steering-label">STEERING</div>
            <div className="steering-bar-bg">
                <div
                    className={`steering-fill ${isLeft ? "steering-left" : "steering-right"}`}
                    style={{
                        width: `${pct}%`,
                        [isLeft ? "right" : "left"]: "50%",
                    }}
                />
                <div className="steering-center" />
            </div>
            <div className="steering-value">
                {isLeft ? "L" : val > 0 ? "R" : "C"} {pct.toFixed(0)}%
            </div>
        </div>
    );
}

function GearDisplay({ gear, drs }: { gear: number; drs: number }) {
    const gearText =
        gear === -1 ? "R" : gear === 0 ? "N" : String(gear || "N");

    return (
        <div className="gear-display">
            <div className={`gear-value ${gear >= 7 ? "gear-limit" : ""}`}>
                {gearText}
            </div>
            <div className={`drs-badge ${drs ? "drs-active" : ""}`}>DRS</div>
        </div>
    );
}

function SpeedDisplay({ speed }: { speed: number }) {
    const safeSpeed = clamp(Math.round(speed || 0), 0, 999);
    return (
        <div className="speed-display">
            <div className="speed-value">{safeSpeed}</div>
            <div className="speed-unit">KM/H</div>
        </div>
    );
}

function TelemetryHeader({
                             lapNum,
                             lapTime,
                             pos,
                         }: {
    lapNum: number;
    lapTime: number;
    pos: number;
}) {
    return (
        <header className="telemetry-header">
            <div className="header-block">
                <span className="header-label">LAP</span>
                <span className="header-value">{lapNum || "–"}</span>
            </div>
            <div className="header-block header-timer">
                <span className="header-label">CURRENT</span>
                <span className="header-value timer">{formatTime(lapTime)}</span>
            </div>
            <div className="header-block">
                <span className="header-label">POS</span>
                <span className="header-value">{pos || "–"}</span>
            </div>
        </header>
    );
}

// ─── Main App ────────────────────────────────────────
export default function App() {
    const [telemetry, setTelemetry] = useState<TelemetryData>({
        speed: 0,
        throttle: 0,
        steer: 0,
        brake: 0,
        clutch: 0,
        gear: 0,
        rpm: 0,
        drs: 0,
    });

    const [lap, setLap] = useState<LapData>({
        currentLapTimeInMS: 0,
        carPosition: 0,
        currentLapNum: 1,
    });

    useEffect(() => {
        const onCarTelemetry = (data: TelemetryData) => {
            setTelemetry({
                speed: data.speed ?? 0,
                throttle: clamp(data.throttle ?? 0, 0, 1),
                steer: clamp(data.steer ?? 0, -1, 1),
                brake: clamp(data.brake ?? 0, 0, 1),
                clutch: clamp(data.clutch ?? 0, 0, 100) / 100,
                gear: data.gear ?? 0,
                rpm: data.rpm ?? 0,
                drs: data.drs ?? 0,
            });
        };

        const onLapData = (data: LapData) => {
            setLap({
                currentLapTimeInMS: data.currentLapTimeInMS ?? 0,
                carPosition: data.carPosition ?? 0,
                currentLapNum: data.currentLapNum ?? 1,
            });
        };

        socket.on("CAR_TELEMETRY", onCarTelemetry);
        socket.on("LAP_DATA", onLapData);

        return () => {
            socket.off("CAR_TELEMETRY", onCarTelemetry);
            socket.off("LAP_DATA", onLapData);
        };
    }, []);

    return (
        <div className="dashboard">
            <TelemetryHeader
                lapNum={lap.currentLapNum}
                lapTime={lap.currentLapTimeInMS}
                pos={lap.carPosition}
            />

            <main className="dashboard-main">
                <aside className="dashboard-left">
                    <PedalCluster
                        throttle={telemetry.throttle}
                        brake={telemetry.brake}
                        clutch={telemetry.clutch}
                    />
                    <SteeringIndicator steer={telemetry.steer} />
                </aside>

                <section className="dashboard-center">
                    <GearDisplay gear={telemetry.gear} drs={telemetry.drs} />
                    <SpeedDisplay speed={telemetry.speed} />
                </section>

                <aside className="dashboard-right">
                    <div className="info-panel">
                        <div className="info-row">
                            <span className="info-key">RPM</span>
                            <span className="info-val">{telemetry.rpm.toLocaleString()}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-key">SPEED</span>
                            <span className="info-val">{telemetry.speed} km/h</span>
                        </div>
                        <div className="info-row">
                            <span className="info-key">GEAR</span>
                            <span className="info-val">
                {telemetry.gear === -1
                    ? "Reverse"
                    : telemetry.gear === 0
                        ? "Neutral"
                        : telemetry.gear}
              </span>
                        </div>
                    </div>
                </aside>
            </main>

            <footer className="dashboard-footer">
                <RpmBar rpm={telemetry.rpm} />
            </footer>
        </div>
    );
}