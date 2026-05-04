import { OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import * as dgram from 'node:dgram';
import { TelemetryParser } from '../TelemetryParser';
import { Server } from 'socket.io';
import { Logger, OnModuleDestroy } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class TelemetryGateway implements OnGatewayInit, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TelemetryGateway.name);
  private readonly udpServer = dgram.createSocket('udp4');
  private readonly PACKET_ID_CAR_TELEMETRY = 6;
  private readonly UDP_PORT = 20777;

  afterInit() {
    this.udpServer.on('message', this.handleMessage.bind(this));
    this.udpServer.on('error', this.handleError.bind(this));

    this.udpServer.bind(this.UDP_PORT, () => {
      this.logger.log(`UDP сервер запущен на порту ${this.UDP_PORT}`);
    });
  }

  private handleMessage(msg: Buffer) {
    if (msg.length < 24) return;

    const packetId = msg.readUInt8(6);
    if (packetId !== this.PACKET_ID_CAR_TELEMETRY) return;

    const data = TelemetryParser.parseCarTelemetry(msg);

    if (!data) return;
    this.logger.verbose(`Скорость: ${data.speed} | Передача: ${data.gear}`);
    this.server.emit('telemetry_update', data);
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
