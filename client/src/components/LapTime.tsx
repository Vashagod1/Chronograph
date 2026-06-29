const formatTime = (ms: number): string => {
    if (!ms || ms < 0) return "00:00.000";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
};

const sectorCalc = (
    sector1MS: number,
    sector1Min: number,
    sector2MS: number,
    sector2Min: number,
    currentLapTime: number,
    lastLapTime: number,
    sector: number,
) => {
    const totalSector1 = (sector1Min * 60000) + sector1MS;
    const totalSector2 = (sector2Min * 60000) + sector2MS;

    let totalSector3 = 0;

    if (sector === 2) {
        totalSector3 = Math.max(0, currentLapTime - totalSector1 - totalSector2);
    } else if (lastLapTime > 0 && totalSector1 > 0 && totalSector2 > 0) {
        totalSector3 = Math.max(0, lastLapTime - totalSector1 - totalSector2);
    }

    return {
        sector1: totalSector1,
        sector2: totalSector2,
        sector3: totalSector3,
    }
}

export function TelemetryHeader({
                                    lapTime,
                                    lastTime,
                                    sector1MS,
                                    sector1Min,
                                    sector2MS,
                                    sector2Min,
                                    sector,
}:{
    lapTime: number;
    lastTime: number;
    sector1MS: number;
    sector1Min: number;
    sector2MS: number;
    sector2Min: number;
    sector: number;
}) {
    const sectors = sectorCalc(
        sector1MS, sector1Min,
        sector2MS, sector2Min,
        lapTime, lastTime, sector);

    return (
        <header className="telemetry-header">
            <div className="header-block">
                <div className="header-label">S1</div>
                <div className="header-value">{formatTime(sectors.sector1)}</div>
            </div>
            <div className="header-block">
                <div className="header-label">S2</div>
                <div className="header-value">{formatTime(sectors.sector2)}</div>
            </div>
            <div className="header-block">
                <div className="header-label">S3</div>
                <div className="header-value">{formatTime(sectors.sector3)}</div>
            </div>

            <div className="header-block header-timer">
                <span className="header-label">CURRENT</span>
                <span className="header-value timer">{formatTime(lapTime)}</span>
            </div><br/>
            <div className="header-block header-last-timer">
                <span className="header-label">LAST</span>
                <span className="header-value last-timer">{formatTime(lastTime)}</span>
            </div>
        </header>
    );
}