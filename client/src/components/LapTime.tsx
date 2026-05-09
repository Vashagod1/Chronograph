const formatTime = (ms: number): string => {
    if (!ms || ms < 0) return "00:00.000";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
};

export function TelemetryHeader({
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