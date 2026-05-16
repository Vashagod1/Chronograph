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
    currentLapTimeInMS: number;
    carPosition: number;
    currentLapNum: number;
}