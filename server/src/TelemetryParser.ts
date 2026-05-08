import { Buffer } from 'node:buffer';

export interface CarTelemetryData {
  speed: number;
  throttle: number;
  steer: number;
  brake: number;
  clutch: number;
  gear: number;
  rpm: number;
  drs: number;
}

export interface LapData {
  currentLapTimeInMS: number;
  carPosition: number;
  currentLapNum: number;
}

const TELEMETRY_CAR_OFFSET = {
  SPEED: 0,
  THROTTLE: 2,
  STEER: 6,
  BRAKE: 10,
  CLUTCH: 14,
  GEAR: 15,
  RPM: 16,
  DRS: 18,
} as const;

const TELEMETRY_LAP_OFFSET = {
  CURR_TIME: 4,
  POS: 32,
  NUM: 33,
};

const TELEMETRY_PACKET_ID = {
  CarTelemetry: 6,
  LapData: 2,
} as const;

const HEADER_SIZE = 29;
const CAR_SIZE = 57;
const PLAYER_CAR_INDEX_OFFSET = 27;

export class TelemetryParser {
  static parse(msg: Buffer) {
    const packetId = msg.readUInt8(6);

    switch (packetId) {
      case TELEMETRY_PACKET_ID.CarTelemetry:
        return { type: 'CAR_TELEMETRY', data: this.parseCarTelemetry(msg) };
      case TELEMETRY_PACKET_ID.LapData:
        return { type: 'LAP_DATA', data: this.parseLapData(msg) };
      default:
        return null;
    }
  }

  static parseCarTelemetry(msg: Buffer): CarTelemetryData | null {
    if (msg.length < 1352) return null;

    const playerIndex = msg.readUInt8(PLAYER_CAR_INDEX_OFFSET);
    const CAR_TELEMETRY_SIZE = 60;
    const myStart = HEADER_SIZE + (playerIndex * CAR_TELEMETRY_SIZE);
    return {
      speed: msg.readUInt16LE(myStart + TELEMETRY_CAR_OFFSET.SPEED),
      throttle: msg.readFloatLE(myStart + TELEMETRY_CAR_OFFSET.THROTTLE),
      steer: msg.readFloatLE(myStart + TELEMETRY_CAR_OFFSET.STEER),
      brake: msg.readFloatLE(myStart + TELEMETRY_CAR_OFFSET.BRAKE),
      clutch: msg.readUInt8(myStart + TELEMETRY_CAR_OFFSET.CLUTCH),
      gear: msg.readInt8(myStart + TELEMETRY_CAR_OFFSET.GEAR),
      rpm: msg.readUInt16LE(myStart + TELEMETRY_CAR_OFFSET.RPM),
      drs: msg.readUInt8(myStart + TELEMETRY_CAR_OFFSET.DRS),
    };
  }

  static parseLapData(msg: Buffer): LapData | null {
    if (msg.length < 1285) return null;
    const playerIndex = msg.readUInt8(PLAYER_CAR_INDEX_OFFSET);
    const myCarStart = HEADER_SIZE + playerIndex * CAR_SIZE;

    return {
      currentLapTimeInMS: msg.readUInt32LE(myCarStart + TELEMETRY_LAP_OFFSET.CURR_TIME),
      carPosition: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.POS),
      currentLapNum: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.NUM),
    };
  }
}
