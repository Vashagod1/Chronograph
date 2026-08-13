import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryGateway } from './telemetry.gateway';
import { LapsService } from '../laps/laps.service';
import { PrismaService } from '../../prisma/PrismaService';
import { LapsRepository } from '../laps/laps.repository';

@Module({
  providers: [TelemetryGateway, TelemetryService, LapsService, LapsRepository, PrismaService],
})
export class TelemetryModule {}
