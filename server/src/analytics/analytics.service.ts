import { Injectable } from '@nestjs/common';
import { CalculateIdealLapDto } from './dto/theoretical-best-lap.dto';

@Injectable()
export class AnalyticsService {
  calculateTheoreticalBest(dto: CalculateIdealLapDto) {
    if (!dto || !dto.laps || dto.laps.length === 0) {
      return null;
    }

    const { laps } = dto;

    const bestS1 = Math.min(...laps.map((lap) => lap.s1));
    const bestS2 = Math.min(...laps.map((lap) => lap.s2));
    const bestS3 = Math.min(...laps.map((lap) => lap.s3));

    return {
      bestS1,
      bestS2,
      bestS3,
      theoreticalBestLapTime: bestS1 + bestS2 + bestS3,
    };
  }
}
