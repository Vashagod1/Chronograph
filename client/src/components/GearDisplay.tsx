import {useMemo} from "react";

export function GearDisplay({
                                gear,
                                drs,
                                rpm
                            }: {
    gear: number;
    drs: number;
    rpm: number
}) {
    const gearText = gear === -1 ? "R" : gear === 0 ? "N" : String(gear || "N");

    const SHIFT_THRESHOLD = 11000;
    const MAX_RPM = 12000;
    const MAX_GEAR = 8;

    const canShiftUp = gear < MAX_GEAR && gear > 0;
    const isShiftTime = canShiftUp && rpm >= SHIFT_THRESHOLD;
    const isCritical = canShiftUp && rpm >= MAX_RPM - 200;

    const shiftColor = useMemo(() => {
        if (isCritical) return "#ff0000";
        if (isShiftTime) return "#ffcc00";
        return "transparent";
    }, [isShiftTime, isCritical]);

    return (
        <div className="gear-display">
            <div
                className={`shift-indicator ${isShiftTime ? 'shift-visible' : ''}`}
                style={{color: shiftColor}}
            >
                {isCritical ? "SHIFT NOW!" : isShiftTime ? "SHIFT!" : ""}
            </div>

            <div className={`gear-value ${isShiftTime ? 'gear-flash' : ''}`}>
                {gearText}
            </div>

            <div className={`drs-badge ${drs ? "drs-active" : ""}`}>
                DRS
            </div>
        </div>
    );
}