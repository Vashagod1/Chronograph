import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsService],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('Should correctly calculated theoretical best lap', () => {
    const mockInput = {
      laps: [
        { s1: 30, s2: 40, s3: 20, lastLapTime: 90 },
        { s1: 29, s2: 42, s3: 21, lastLapTime: 92 },
        { s1: 31, s2: 39, s3: 19, lastLapTime: 89 },
      ],
    };

    expect(service).toBeDefined();

    const result = service.calculateTheoreticalBest(mockInput);
    expect(result).not.toBeNull();
    expect(result?.bestS1).toBe(29);
    expect(result?.bestS2).toBe(39);
    expect(result?.bestS3).toBe(19);
    expect(result?.theoreticalBestLapTime).toBe(87);
  });
});
