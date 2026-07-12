import { OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import TelemetryParser, { CarTelemetryData, LapData } from '../TelemetryParser';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import * as dgram from 'node:dgram';
import { Server } from 'socket.io';
import { LapsService } from '../laps/laps.service';

@WebSocketGateway({ cors: true })
export class TelemetryGateway implements OnGatewayInit, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TelemetryGateway.name);
  private readonly udpServer: dgram.Socket = dgram.createSocket('udp4');
  private readonly UDP_PORT = 20777;

  private lastTelemetry: CarTelemetryData | null = null;
  private lastLapData: LapData | null = null;
  private currentSessionId: string | null = null;

  constructor(private readonly lapsService: LapsService) {}

  afterInit() {
    this.udpServer.on('message', this.handleMessage.bind(this));
    this.udpServer.on('error', this.handleError.bind(this));

    this.udpServer.bind(this.UDP_PORT, () => {
      this.logger.log(`UDP сервер запущен на порту ${this.UDP_PORT}`);
    });
  }

  private handleMessage(msg: Buffer) {
    const parsed = TelemetryParser.parse(msg);

    if (!parsed) return;

    this.server.emit(parsed.type, {
      sessionId: parsed.sessionId,
      ...parsed.data,
    });

    if (this.currentSessionId !== parsed.sessionId) {
      this.logger.log(`[Гейтвей] Сессия сменилась ${parsed.sessionId}, сбрасываем сессию`);

      this.currentSessionId = parsed.sessionId;
      this.lastTelemetry = null;
      this.lastLapData = null;

      this.lapsService.resetCurrentLap();
    }

    if (parsed.type === 'CAR_TELEMETRY') {
      this.lastTelemetry = parsed.data as CarTelemetryData;
    } else if (parsed.type === 'LAP_DATA') {
      this.lastLapData = parsed.data as LapData;
    }

    if (this.lastTelemetry && this.lastLapData) {
      this.lapsService.handleIncomingPacket(this.lastTelemetry, this.lastLapData, parsed.sessionId);

      this.lastTelemetry = null;
      this.lastLapData = null;
    }
  }

  private handleError(err: Error) {
    this.logger.error('UDP ошибка', err.stack);
  }

  onModuleDestroy() {
    this.udpServer.close(() => {
      this.logger.log('UDP сокет закрыт');
    });
  }
}
