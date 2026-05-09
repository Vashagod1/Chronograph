import {clamp} from "./Clamp.tsx";

export function SpeedDisplay({ speed }: { speed: number }) {
    const safeSpeed = clamp(Math.round(speed || 0), 0, 999);
    return (
        <div className="speed-display">
            <div className="speed-value">{safeSpeed}</div>
            <div className="speed-unit">KM/H</div>
        </div>
    );
}