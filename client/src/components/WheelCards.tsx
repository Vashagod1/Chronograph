import type {WheelData} from "../types/telemetry.ts";
import {SURFACE_TYPES, SURFACE_COLORS} from "../utils/surfaceTypes.ts";

export function WheelCards({wheels}: { wheels: WheelData[] }) {
    const positions = [
        {name: "FL", gridArea: "fl"},
        {name: "FR", gridArea: "fr"},
        {name: "RL", gridArea: "rl"},
        {name: "RR", gridArea: "rr"},
    ];

    return (
        <div style={{
            display: 'grid',
            gridTemplateAreas: '"fl fr" "rl rr"',
            gap: '8px',
            width: '300px'
        }}>
            {wheels.map((w, i) => {
                const surfaceName = SURFACE_TYPES[w.surfaceType] ?? `Unknown (${w.surfaceType})`;
                const surfaceColor = SURFACE_COLORS[w.surfaceType] ?? '#ffffff';
                const isOffTrack = w.surfaceType !== 0;

                return (
                    <div key={i} style={{
                        gridArea: positions[i].gridArea,
                        border: `2px solid ${isOffTrack ? surfaceColor : '#444'}`,
                        padding: '10px',
                        borderRadius: '4px',
                        background: '#1a1a1a',
                        boxShadow: isOffTrack ? `0 0 8px ${surfaceColor}44` : 'none',
                        transition: 'all 0.2s ease'
                    }}>
                        <div style={{
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>{positions[i].name}</span>
                            {isOffTrack && (
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: surfaceColor,
                                    display: 'inline-block',
                                    boxShadow: `0 0 6px ${surfaceColor}`
                                }}/>
                            )}
                        </div>
                        <div style={{fontSize: '12px', lineHeight: '1.6'}}>
                            {/* Тормоза */}
                            <div style={{color: tempColor(w.brakeTemp), fontWeight: 'bold'}}>
                                Brake: {w.brakeTemp}°C
                            </div>

                            {/* Полоса для внутренней температуры */}
                            <div style={{marginTop: '6px', marginBottom: '8px'}}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '11px',
                                    color: '#aaa'
                                }}>
                                    <span>Inner (Core)</span>
                                    <span style={{
                                        color: getInnerTempColor(w.innerTemp),
                                        fontWeight: 'bold'
                                    }}>{w.innerTemp}°C</span>
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: '4px',
                                    background: '#333',
                                    borderRadius: '2px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${Math.min(Math.max((w.innerTemp / 140) * 100, 0), 100)}%`,
                                        height: '100%',
                                        background: getInnerTempColor(w.innerTemp),
                                        transition: 'width 0.3s ease, background 0.3s ease'
                                    }}/>
                                </div>
                            </div>

                            {/* Полоса для температуры поверхности */}
                            <div style={{marginTop: '6px'}}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '11px',
                                    color: '#aaa'
                                }}>
                                    <span>Surface</span>
                                    <span style={{
                                        color: getSurfaceTempColor(w.surfTemp),
                                        fontWeight: 'bold'
                                    }}>{w.surfTemp}°C</span>
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: '4px',
                                    background: '#333',
                                    borderRadius: '2px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${Math.min(Math.max((w.surfTemp / 140) * 100, 0), 100)}%`,
                                        height: '100%',
                                        background: getSurfaceTempColor(w.surfTemp),
                                        transition: 'width 0.1s ease, background 0.1s ease'
                                    }}/>
                                </div>
                            </div>

                            <div>Pressure: {w.pressure.toFixed(1)} PSI</div>

                            {/* Тип поверхности */}
                            <div style={{
                                color: surfaceColor,
                                fontWeight: isOffTrack ? 'bold' : 'normal',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '4px'
                            }}>
                                <span style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '2px',
                                    background: surfaceColor,
                                    display: 'inline-block'
                                }}/>
                                {surfaceName}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function tempColor(temp: number) {
    if (temp > 1000) return '#ff3333';
    if (temp >= 850) return '#daa648';
    if (temp > 800) return '#ffcc00';
    if (temp < 100) return '#24d8fa';
    return '#00ff88';
}

function getSurfaceTempColor(temp: number): string {
    if (temp < 50)  return "#24d8fa";

    if (temp < 55)  return "#1ce4b0";
    if (temp < 60)  return "#14f088";
    if (temp < 65)  return "#0cf860";
    if (temp < 70)  return "#06fc44";
    if (temp < 75)  return "#00ff88";

    if (temp <= 95) return "#00ff88";

    if (temp < 100) return "#33ff66";
    if (temp < 105) return "#66ff44";
    if (temp < 110) return "#99ff22";
    if (temp <= 110)return "#ccff11";

    return "#ff3333"; // > 110°C — перегрев
}

function getInnerTempColor(temp: number): string {
    if (temp < 70)  return "#24d8fa";

    if (temp < 75)  return "#1ce4b0";
    if (temp < 80)  return "#14f088";
    if (temp < 85)  return "#0cf860";
    if (temp < 90)  return "#06fc44";

    if (temp <= 110) return "#00ff88";

    if (temp < 115) return "#33ff66";
    if (temp < 120) return "#66ff44";
    if (temp < 125) return "#99ff22";
    if (temp <= 130) return "#ccff11";

    return "#ff3333";
}