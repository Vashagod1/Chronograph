// src/hooks/useTelemetry.ts
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { clamp } from "../utils/Clamp.tsx";
import type {WheelData, LapData, TelemetryData} from "../types/telemetry.ts";

const socket = io("http://localhost:3000");

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
        engineTemperature: 0,
        wheels: []
    });

    const [lap, setLap] = useState<LapData>({
        currentLapTimeInMS: 0,
        carPosition: 0,
        currentLapNum: 1,
    });

    useEffect(() => {
        const onCarTelemetry = (data: ServerTelemetryData) => {
            const wheels: WheelData[] = [
                {
                    brakeTemp: data.brakeTemps.FL,
                    surfTemp: data.tyreSurfTemps.FL,
                    innerTemp: data.tyreInnerTemps.FL,
                    pressure: data.tyresPressure.FL,
                    surfaceType: data.surfaceType.FL,
                },
                {
                    brakeTemp: data.brakeTemps.FR,
                    surfTemp: data.tyreSurfTemps.FR,
                    innerTemp: data.tyreInnerTemps.FR,
                    pressure: data.tyresPressure.FR,
                    surfaceType: data.surfaceType.FR,
                },
                {
                    brakeTemp: data.brakeTemps.RL,
                    surfTemp: data.tyreSurfTemps.RL,
                    innerTemp: data.tyreInnerTemps.RL,
                    pressure: data.tyresPressure.RL,
                    surfaceType: data.surfaceType.RL,
                },
                {
                    brakeTemp: data.brakeTemps.RR,
                    surfTemp: data.tyreSurfTemps.RR,
                    innerTemp: data.tyreInnerTemps.RR,
                    pressure: data.tyresPressure.RR,
                    surfaceType: data.surfaceType.RR,
                },
            ];

            setTelemetry({
                speed: data.speed ?? 0,
                throttle: clamp(data.throttle ?? 0, 0, 1),
                steer: clamp(data.steer ?? 0, -1, 1),
                brake: clamp(data.brake ?? 0, 0, 1),
                clutch: clamp(data.clutch ?? 0, 0, 100) / 100,
                gear: data.gear ?? 0,
                rpm: data.rpm ?? 0,
                drs: data.drs ?? 0,
                engineTemperature: data.engineTemperature ?? 0,
                wheels
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

    return { telemetry, lap }
}