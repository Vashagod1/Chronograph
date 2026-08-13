import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelemetryModule } from './telemetry/telemetry.module';
import { LapsService } from './laps/laps.service';
import { PrismaService } from '../prisma/PrismaService';
import { AnalyticsModule } from './analytics/analytics.module';
import { LapsRepository } from './laps/laps.repository';

@Module({
  imports: [TelemetryModule, AnalyticsModule],
  controllers: [AppController],
  providers: [AppService, LapsService, LapsRepository, PrismaService],
})
export class AppModule {}
