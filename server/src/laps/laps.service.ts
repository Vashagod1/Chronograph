import { Injectable, Logger } from '@nestjs/common';
import { CarTelemetryData, LapData } from '../TelemetryParser';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/PrismaService';

interface TelemetryPoint {
  speed: number;
  throttle: number;
  steer: number;
  brake: number;
  gear: number;
  rpm: number;
  lapDistance: number;
  currentLapTimeInMS: number;
  sector: number;
  engineTemp: number;
  tyreSurfTemps: { RL: number; RR: number; FL: number; FR: number };
  tyreInnerTemps: { RL: number; RR: number; FL: number; FR: number };
  surfaceType: { RL: number; RR: number; FL: number; FR: number };
  lapInvalid: number;
  driverStatus: number;
  resultStatus: number;
}

interface ActiveLapBuffer {
  sessionId: string;
  lapNumber: number;
  points: TelemetryPoint[];
}

@Injectable()
export class LapsService {
  [x: string]: any;
  private currentLap: ActiveLapBuffer | null = null;
  private readonly logger = new Logger();

  constructor(private readonly prisma: PrismaService) {}

  handleIncomingPacket(CarTelemetryData: CarTelemetryData, LapData: LapData, sessionId: string) {
    if (this.currentLap && (LapData.resultStatus === 4 || LapData.resultStatus === 5 || LapData.resultStatus === 7)) {
      this.logger.log(`[Сервис] Обнаружен сход пилота (DNF/Retirement). Экстренно сохраняем круг №${this.currentLap.lapNumber}`);

      const isDNF = this.currentLap;

      if (isDNF) {
        this.currentLap = null;

        this.saveLapToDataBase(isDNF).catch((err) => console.log(err));
      }

      return;
    }

    if (this.currentLap === null) {
      this.currentLap = {
        sessionId: sessionId,
        lapNumber: LapData.currentLapNum,
        points: [],
      };
    }

    if (LapData.currentLapNum > this.currentLap.lapNumber) {
      const lapToSave = this.currentLap;

      this.currentLap = {
        sessionId: sessionId,
        lapNumber: LapData.currentLapNum,
        points: [],
      };

      this.saveLapToDataBase(lapToSave).catch((err) => {
        console.error(`Ошибка в сохранении круга в БД:`, err);
      });
    }

    if (this.currentLap.points.length > 0 && LapData.currentLapTimeInMS < this.currentLap.points[this.currentLap.points.length - 1].currentLapTimeInMS) {
      const deleteFromIndex = this.currentLap.points.findIndex((point) => point.currentLapTimeInMS > LapData.currentLapTimeInMS);

      if (deleteFromIndex !== -1) {
        this.currentLap.points.splice(deleteFromIndex);
      }
    }

    const newPoint: TelemetryPoint = {
      speed: CarTelemetryData.speed,
      throttle: CarTelemetryData.throttle,
      steer: CarTelemetryData.steer,
      brake: CarTelemetryData.brake,
      gear: CarTelemetryData.gear,
      rpm: CarTelemetryData.rpm,
      engineTemp: CarTelemetryData.engineTemperature,
      tyreSurfTemps: {
        RL: CarTelemetryData.tyreSurfTemps.RL,
        RR: CarTelemetryData.tyreSurfTemps.RR,
        FL: CarTelemetryData.tyreSurfTemps.FL,
        FR: CarTelemetryData.tyreSurfTemps.FR,
      },
      tyreInnerTemps: {
        RL: CarTelemetryData.tyreInnerTemps.RL,
        RR: CarTelemetryData.tyreInnerTemps.RR,
        FL: CarTelemetryData.tyreInnerTemps.FL,
        FR: CarTelemetryData.tyreInnerTemps.FR,
      },
      surfaceType: {
        RL: CarTelemetryData.surfaceType.RL,
        RR: CarTelemetryData.surfaceType.RR,
        FL: CarTelemetryData.surfaceType.FL,
        FR: CarTelemetryData.surfaceType.FR,
      },
      lapDistance: LapData.lapDistance,
      currentLapTimeInMS: LapData.currentLapTimeInMS,
      sector: LapData.sector,
      lapInvalid: LapData.currentLapInvalid,
      driverStatus: LapData.driverStatus,
      resultStatus: LapData.resultStatus,
    };
    this.currentLap.points.push(newPoint);
  }

  getCurrentLap() {
    return this.currentLap;
  }

  resetCurrentLap() {
    this.currentLap = null;
  }

  async saveLapToDataBase(lapBuffer: ActiveLapBuffer) {
    if (lapBuffer.points.length === 0) return;

    await this.prisma.session.upsert({
      where: { id: lapBuffer.sessionId },
      update: {},
      create: {
        id: lapBuffer.sessionId,
        trackId: 0,
      },
    });

    const lastPoint = lapBuffer.points[lapBuffer.points.length - 1];

    const finalTimeInMS = lastPoint.currentLapTimeInMS;
    const isLapInvalid = lastPoint.lapInvalid;

    const createdLap = await this.prisma.lap.create({
      data: {
        sessionId: lapBuffer.sessionId,
        lapNumber: lapBuffer.lapNumber,
        finalTimeInMS: finalTimeInMS,
        isLapInvalid: isLapInvalid === 1,
        telemetryData: lapBuffer.points as unknown as Prisma.InputJsonValue,
      },
    });

    console.log(`[БД] Круг №${createdLap.lapNumber} успешно сохранен! ID записи: ${createdLap.id}`);
  }
}
