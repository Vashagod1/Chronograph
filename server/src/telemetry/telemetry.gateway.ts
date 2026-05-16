import { OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { CarTelemetryData, LapData, TelemetryParser } from '../TelemetryParser';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import * as dgram from 'node:dgram';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class TelemetryGateway implements OnGatewayInit, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TelemetryGateway.name);
  private readonly udpServer: dgram.Socket = dgram.createSocket('udp4');
  private readonly UDP_PORT = 20777;

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

    this.server.emit(parsed.type, parsed.data);

    if (parsed.type === 'CAR_TELEMETRY') {
      const telemetry = parsed.data as CarTelemetryData;
      this.logger.verbose(`Скорость: ${telemetry.speed}`);
    } else if (parsed.type === 'LAP_DATA') {
      const lap = parsed.data as LapData;
      this.logger.verbose(`Круг: ${lap.currentLapNum} | Позиция: ${lap.carPosition}`);
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
