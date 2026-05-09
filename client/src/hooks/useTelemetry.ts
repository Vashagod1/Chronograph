import {io} from "socket.io-client";
import {useEffect, useState} from "react";
import {clamp} from "../components/Clamp.tsx";

const socket = io("http://localhost:3000");

interface TelemetryData {
    speed: number;
    throttle: number;
    steer: number;
    brake: number;
    clutch: number;
    gear: number;
    rpm: number;
    drs: number;
}

interface LapData {
    currentLapTimeInMS: number;
    carPosition: number;
    currentLapNum: number;
}

export function useTelemetry() {
    const [telemetry, setTelemetry] = useState<TelemetryData>({
        speed: 0,
        throttle: 0,
        steer: 0,
        brake: 0,
        clutch: 0,
        gear: 0,
        rpm: 0,
        drs: 0,
    });

    const [lap, setLap] = useState<LapData>({
        currentLapTimeInMS: 0,
        carPosition: 0,
        currentLapNum: 1,
    });

    useEffect(() => {
        const onCarTelemetry = (data: TelemetryData) => {
            setTelemetry({
                speed: data.speed ?? 0,
                throttle: clamp(data.throttle ?? 0, 0, 1),
                steer: clamp(data.steer ?? 0, -1, 1),
                brake: clamp(data.brake ?? 0, 0, 1),
                clutch: clamp(data.clutch ?? 0, 0, 100) / 100,
                gear: data.gear ?? 0,
                rpm: data.rpm ?? 0,
                drs: data.drs ?? 0,
            });
        };

        const onLapData = (data: LapData) => {
            setLap({
                currentLapTimeInMS: data.currentLapTimeInMS ?? 0,
                carPosition: data.carPosition ?? 0,
                currentLapNum: data.currentLapNum ?? 1,
            });
        };

        socket.on("CAR_TELEMETRY", onCarTelemetry);
        socket.on("LAP_DATA", onLapData);

        return () => {
            socket.off("CAR_TELEMETRY", onCarTelemetry);
            socket.off("LAP_DATA", onLapData);
        };
    }, []);

    return { telemetry, lap}
}