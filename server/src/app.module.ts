import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelemetryModule } from './telemetry/telemetry.module';
import { LapsService } from './laps/laps.service';
import { PrismaService } from '../prisma/PrismaService';

@Module({
  imports: [TelemetryModule],
  controllers: [AppController],
  providers: [AppService, LapsService, PrismaService],
})
export class AppModule {}
