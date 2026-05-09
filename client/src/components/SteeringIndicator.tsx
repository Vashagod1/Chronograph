import {clamp} from "./Clamp.tsx";

export function SteeringIndicator({ steer }: { steer: number }) {
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