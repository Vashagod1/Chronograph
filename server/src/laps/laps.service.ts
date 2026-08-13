import { Injectable, Logger } from '@nestjs/common';
import { CarTelemetryData, LapData } from '../TelemetryParser';
import { LapsRepository } from './laps.repository';

export enum ResultStatus {
  INVALID = 0,
  INACTIVE = 1,
  ACTIVE = 2,
  FINISHED = 3,
  DID_NOT_FINISH = 4,
  DISQUALIFIED = 5,
  NOT_CLASSIFIED = 6,
  RETIRED = 7,
}

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

export interface ActiveLapBuffer {
  sessionId: string;
  lapNumber: number;
  lastLapTimeInMS?: number;
  points: TelemetryPoint[];
  sector1TimeMS?: number;
  sector2TimeMS?: number;
}

@Injectable()
export class LapsService {
  private currentLap: ActiveLapBuffer | null = null;
  private readonly logger = new Logger();

  constructor(private readonly lapsRepository: LapsRepository) {}

  private readonly RETIREMENT_STATUSES = [ResultStatus.DID_NOT_FINISH, ResultStatus.DISQUALIFIED, ResultStatus.RETIRED];
  private readonly FINISHED_STATUS = [ResultStatus.FINISHED];

  async handleIncomingPacket(carTelemetryData: CarTelemetryData, lapData: LapData, sessionId: string) {
    if (this.currentLap && this.RETIREMENT_STATUSES.includes(lapData.resultStatus)) {
      this.logger.log(`[Сервис] Обнаружен сход пилота (DNF/Retirement). Экстренно сохраняем круг №${this.currentLap.lapNumber}`);

      const lapToSave = this.currentLap;
      lapToSave.lastLapTimeInMS = lapData.lastLapTimeInMS;
      this.currentLap = null;

      this.lapsRepository.saveLapToDataBase(lapToSave).catch((err) => {
        this.logger.error(`Ошибка при экстренном сохранении DNF круга:`, err);
      });

      return;
    }

    if (this.currentLap === null) {
      if (this.FINISHED_STATUS.includes(lapData.resultStatus)) {
        return;
      }

      this.currentLap = {
        sessionId: sessionId,
        lapNumber: lapData.currentLapNum,
        lastLapTimeInMS: lapData.lastLapTimeInMS,
        points: [],
      };
    }

    if (lapData.currentLapNum > this.currentLap.lapNumber) {
      const lapToSave = this.currentLap;
      lapToSave.lastLapTimeInMS = lapData.lastLapTimeInMS;

      this.currentLap = {
        sessionId: sessionId,
        lapNumber: lapData.currentLapNum,
        points: [],
      };

      this.lapsRepository.saveLapToDataBase(lapToSave).catch((err) => {
        console.error(`Ошибка в сохранении круга в БД:`, err);
      });
    }

    if (this.currentLap.points.length > 0 && lapData.currentLapTimeInMS < this.currentLap.points[this.currentLap.points.length - 1].currentLapTimeInMS) {
      const deleteFromIndex = this.currentLap.points.findIndex((point) => point.currentLapTimeInMS > lapData.currentLapTimeInMS);

      if (deleteFromIndex !== -1) {
        this.currentLap.points.splice(deleteFromIndex);
      }
    }

    const newPoint: TelemetryPoint = {
      speed: carTelemetryData.speed,
      throttle: carTelemetryData.throttle,
      steer: carTelemetryData.steer,
      brake: carTelemetryData.brake,
      gear: carTelemetryData.gear,
      rpm: carTelemetryData.rpm,
      engineTemp: carTelemetryData.engineTemperature,
      tyreSurfTemps: {
        RL: carTelemetryData.tyreSurfTemps.RL,
        RR: carTelemetryData.tyreSurfTemps.RR,
        FL: carTelemetryData.tyreSurfTemps.FL,
        FR: carTelemetryData.tyreSurfTemps.FR,
      },
      tyreInnerTemps: {
        RL: carTelemetryData.tyreInnerTemps.RL,
        RR: carTelemetryData.tyreInnerTemps.RR,
        FL: carTelemetryData.tyreInnerTemps.FL,
        FR: carTelemetryData.tyreInnerTemps.FR,
      },
      surfaceType: {
        RL: carTelemetryData.surfaceType.RL,
        RR: carTelemetryData.surfaceType.RR,
        FL: carTelemetryData.surfaceType.FL,
        FR: carTelemetryData.surfaceType.FR,
      },
      lapDistance: lapData.lapDistance,
      currentLapTimeInMS: lapData.currentLapTimeInMS,
      sector: lapData.sector,
      lapInvalid: lapData.currentLapInvalid,
      driverStatus: lapData.driverStatus,
      resultStatus: lapData.resultStatus,
    };
    this.currentLap.points.push(newPoint);

    if (!this.currentLap.sector1TimeMS) {
      const s1 = lapData.sector1TimeMinutesPart * 60000 + lapData.sector1TimeMSPart;
      if (s1 > 0) {
        this.currentLap.sector1TimeMS = s1;
      }
    }

    if (!this.currentLap.sector2TimeMS) {
      const s2 = lapData.sector2TimeMinutesPart * 60000 + lapData.sector2TimeMSPart;
      if (s2 > 0) {
        this.currentLap.sector2TimeMS = s2;
      }
    }

    if (this.currentLap && this.FINISHED_STATUS.includes(lapData.resultStatus)) {
      this.logger.log(`[Сервис] Последний круг зафиксирован. Круг №${this.currentLap.lapNumber}`);
      const lapToSave = this.currentLap;
      lapToSave.lastLapTimeInMS = lapData.lastLapTimeInMS;
      this.currentLap = null;
      await this.lapsRepository.saveLapToDataBase(lapToSave);
      return;
    }
  }

  getCurrentLap() {
    return this.currentLap;
  }

  resetCurrentLap() {
    this.currentLap = null;
  }
}
