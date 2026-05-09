import {useMemo} from "react";
import {clamp} from "./Clamp.tsx";

export function RpmBar({ rpm }: { rpm: number }) {
    const TOTAL_BARS = 20;
    const MAX_RPM = 12000;

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