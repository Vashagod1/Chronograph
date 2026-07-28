import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelemetryModule } from './telemetry/telemetry.module';
import { LapsService } from './laps/laps.service';
import { PrismaService } from '../prisma/PrismaService';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [TelemetryModule, AnalyticsModule],
  controllers: [AppController],
  providers: [AppService, LapsService, PrismaService],
})
export class AppModule {}
