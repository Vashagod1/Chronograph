import {clamp} from "../utils/Clamp.tsx";

export function PedalCluster({
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