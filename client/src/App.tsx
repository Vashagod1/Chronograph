import {SteeringIndicator} from "./components/SteeringIndicator.tsx";
import {GearDisplay} from "./components/GearDisplay.tsx";
import {SpeedDisplay} from "./components/SpeedDisplay.tsx";
import {TelemetryHeader} from "./components/LapTime.tsx";
import {PedalCluster} from "./components/Pedal.tsx";
import {RpmBar} from "./components/RpmBars.tsx";
import {useTelemetry} from "./hooks/useTelemetry.ts";
import "./App.css";

export default function App() {
    const { telemetry, lap } = useTelemetry();

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
                    <GearDisplay
                        gear={telemetry.gear}
                        drs={telemetry.drs}
                        rpm={telemetry.rpm}
                    />
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