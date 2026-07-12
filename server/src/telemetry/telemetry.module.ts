import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryGateway } from './telemetry.gateway';
import { LapsService } from '../laps/laps.service';
import { PrismaService } from '../../prisma/PrismaService';

@Module({
  providers: [TelemetryGateway, TelemetryService, LapsService, PrismaService],
})
export class TelemetryModule {}
