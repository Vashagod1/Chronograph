import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/PrismaService';
import { ActiveLapBuffer } from './laps.service';

@Injectable()
export class LapsRepository {
  constructor(private readonly prisma: PrismaService) {}

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

    const isLapInvalid = lapBuffer.points.some((p) => p.lapInvalid === 1);
    const finalTimeInMS = lapBuffer.lastLapTimeInMS;

    const s1 = lapBuffer.sector1TimeMS ?? null;
    const s2 = lapBuffer.sector2TimeMS ?? null;

    let s3: number | null = null;
    if (finalTimeInMS && s1 && s2) {
      const rawS3 = finalTimeInMS - s1 - s2;
      s3 = rawS3 > 0 ? rawS3 : null;
    }

    const createdLap = await this.prisma.lap.create({
      data: {
        sessionId: lapBuffer.sessionId,
        lapNumber: lapBuffer.lapNumber,
        finalTimeInMS: finalTimeInMS,
        isLapInvalid: isLapInvalid,
        telemetryData: lapBuffer.points as unknown as Prisma.InputJsonValue,
        sector1TimeMS: s1,
        sector2TimeMS: s2,
        sector3TimeMS: s3,
      },
    });
  }
}
