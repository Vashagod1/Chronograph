export interface ServerTelemetryData {
    speed: number;
    throttle: number;
    steer: number;
    brake: number;
    clutch: number;
    gear: number;
    rpm: number;
    drs: number;
    engineTemperature: number;
    brakeTemps: { RL: number; RR: number; FL: number; FR: number };
    tyreSurfTemps: { RL: number; RR: number; FL: number; FR: number };
    tyreInnerTemps: { RL: number; RR: number; FL: number; FR: number };
    tyresPressure: { RL: number; RR: number; FL: number; FR: number };
    surfaceType: { RL: number; RR: number; FL: number; FR: number };
}

export interface WheelData {
    brakeTemp: number;
    surfTemp: number;
    innerTemp: number;
    pressure: number;
    surfaceType: number;
}

export interface TelemetryData {
    speed: number;
    throttle: number;
    steer: number;
    brake: number;
    clutch: number;
    gear: number;
    rpm: number;
    drs: number;
    engineTemperature: number;
    wheels: WheelData[];
}

export interface LapData {
    lastLapTimeInMS: number;
    currentLapTimeInMS: number;
    sector1TimeMSPart: number;
    sector1TimeMinutesPart: number;
    sector2TimeMSPart: number;
    sector2TimeMinutesPart: number;
    carPosition: number;
    currentLapNum: number;
    sector: number;
}