export class TheoreticalBestLapDto {
  s1: number;
  s2: number;
  s3: number;
  lastLapTime: number;
}

export class CalculateIdealLapDto {
  laps: TheoreticalBestLapDto[] | undefined;
}
