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
  brakeTemps: { RL: number; RR: number; FL: number; FR: number };
  tyreSurfTemps: { RL: number; RR: number; FL: number; FR: number };
  tyreInnerTemps: { RL: number; RR: number; FL: number; FR: number };
  engineTemperature: number;
  tyresPressure: { RL: number; RR: number; FL: number; FR: number };
  surfaceType: { RL: number; RR: number; FL: number; FR: number };
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
  BRAKE_TEMPS: 22,
  TYRE_SURF_TEMPS: 30,
  TYRE_INNER_TEMPS: 34,
  ENGINE_TEMP: 38,
  TYRE_PRESSURE: 40,
  SURFACE_TYPE: 56,
} as const;

const TELEMETRY_LAP_OFFSET = {
  LAST_LAP_TIME: 0,
  CURR_TIME: 4,
  SECTOR1_TIME: 8,
  POS: 32,
  NUM: 33,
};

const TELEMETRY_PACKET_ID = {
  LapData: 2,
  CarTelemetry: 6,
} as const;

// 2 байт uint16
const BRAKE_TEMP_OFFSET = {
  RL: 0,
  RR: 2,
  FL: 4,
  FR: 6,
} as const;

// 1 байт uint8/int8
const TYRE_TEMP_OFFSET = {
  RL: 0,
  RR: 1,
  FL: 2,
  FR: 3,
} as const;

const SURFACE_TYPE_OFFSET = {
  RL: 0,
  RR: 1,
  FL: 2,
  FR: 3,
} as const;

// 4 байта float
const TYRE_PRESSURE_OFFSET = {
  RL: 0,
  RR: 4,
  FL: 8,
  FR: 12,
} as const;

const HEADER_SIZE = 29;
const LAP_DATA_SIZE = 57;
const PLAYER_CAR_INDEX_OFFSET = 27;
const LAP_DATA_PACKET_SIZE = 1285;

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
    const playerIndex = msg.readUInt8(PLAYER_CAR_INDEX_OFFSET);
    const CAR_TELEMETRY_DATA_SIZE = 60;
    const myStart = HEADER_SIZE + playerIndex * CAR_TELEMETRY_DATA_SIZE;

    if (msg.length < myStart + CAR_TELEMETRY_DATA_SIZE) return null;

    return {
      speed: msg.readUInt16LE(myStart + TELEMETRY_CAR_OFFSET.SPEED),
      throttle: msg.readFloatLE(myStart + TELEMETRY_CAR_OFFSET.THROTTLE),
      steer: msg.readFloatLE(myStart + TELEMETRY_CAR_OFFSET.STEER),
      brake: msg.readFloatLE(myStart + TELEMETRY_CAR_OFFSET.BRAKE),
      clutch: msg.readUInt8(myStart + TELEMETRY_CAR_OFFSET.CLUTCH),
      gear: msg.readInt8(myStart + TELEMETRY_CAR_OFFSET.GEAR),
      rpm: msg.readUInt16LE(myStart + TELEMETRY_CAR_OFFSET.RPM),
      drs: msg.readUInt8(myStart + TELEMETRY_CAR_OFFSET.DRS),
      brakeTemps: {
        RL: msg.readUInt16LE(myStart + TELEMETRY_CAR_OFFSET.BRAKE_TEMPS + BRAKE_TEMP_OFFSET.RL),
        RR: msg.readUInt16LE(myStart + TELEMETRY_CAR_OFFSET.BRAKE_TEMPS + BRAKE_TEMP_OFFSET.RR),
        FL: msg.readUInt16LE(myStart + TELEMETRY_CAR_OFFSET.BRAKE_TEMPS + BRAKE_TEMP_OFFSET.FL),
        FR: msg.readUInt16LE(myStart + TELEMETRY_CAR_OFFSET.BRAKE_TEMPS + BRAKE_TEMP_OFFSET.FR),
      },
      tyreSurfTemps: {
        RL: msg.readUInt8(myStart + TELEMETRY_CAR_OFFSET.TYRE_SURF_TEMPS + TYRE_TEMP_OFFSET.RL),
        RR: msg.readUInt8(myStart + TELEMETRY_CAR_OFFSET.TYRE_SURF_TEMPS + TYRE_TEMP_OFFSET.RR),
        FL: msg.readUInt8(myStart + TELEMETRY_CAR_OFFSET.TYRE_SURF_TEMPS + TYRE_TEMP_OFFSET.FL),
        FR: msg.readUInt8(myStart + TELEMETRY_CAR_OFFSET.TYRE_SURF_TEMPS + TYRE_TEMP_OFFSET.FR),
      },
      tyreInnerTemps: {
        RL: msg.readUInt8(myStart + TELEMETRY_CAR_OFFSET.TYRE_INNER_TEMPS + TYRE_TEMP_OFFSET.RL),
        RR: msg.readUInt8(myStart + TELEMETRY_CAR_OFFSET.TYRE_INNER_TEMPS + TYRE_TEMP_OFFSET.RR),
        FL: msg.readUInt8(myStart + TELEMETRY_CAR_OFFSET.TYRE_INNER_TEMPS + TYRE_TEMP_OFFSET.FL),
        FR: msg.readUInt8(myStart + TELEMETRY_CAR_OFFSET.TYRE_INNER_TEMPS + TYRE_TEMP_OFFSET.FR),
      },
      engineTemperature: msg.readUInt16LE(myStart + TELEMETRY_CAR_OFFSET.ENGINE_TEMP),
      tyresPressure: {
        RL: msg.readFloatLE(myStart + TELEMETRY_CAR_OFFSET.TYRE_PRESSURE + TYRE_PRESSURE_OFFSET.RL),
        RR: msg.readFloatLE(myStart + TELEMETRY_CAR_OFFSET.TYRE_PRESSURE + TYRE_PRESSURE_OFFSET.RR),
        FL: msg.readFloatLE(myStart + TELEMETRY_CAR_OFFSET.TYRE_PRESSURE + TYRE_PRESSURE_OFFSET.FL),
        FR: msg.readFloatLE(myStart + TELEMETRY_CAR_OFFSET.TYRE_PRESSURE + TYRE_PRESSURE_OFFSET.FR),
      },
      surfaceType: {
        RL: msg.readUInt8(myStart + TELEMETRY_CAR_OFFSET.SURFACE_TYPE + SURFACE_TYPE_OFFSET.RL),
        RR: msg.readUInt8(myStart + TELEMETRY_CAR_OFFSET.SURFACE_TYPE + SURFACE_TYPE_OFFSET.RR),
        FL: msg.readUInt8(myStart + TELEMETRY_CAR_OFFSET.SURFACE_TYPE + SURFACE_TYPE_OFFSET.FL),
        FR: msg.readUInt8(myStart + TELEMETRY_CAR_OFFSET.SURFACE_TYPE + SURFACE_TYPE_OFFSET.FR),
      },
    };
  }

  static parseLapData(msg: Buffer): LapData | null {
    if (msg.length < LAP_DATA_PACKET_SIZE) return null;
    const playerIndex = msg.readUInt8(PLAYER_CAR_INDEX_OFFSET);
    const myCarStart = HEADER_SIZE + playerIndex * LAP_DATA_SIZE;

    return {
      currentLapTimeInMS: msg.readUInt32LE(myCarStart + TELEMETRY_LAP_OFFSET.CURR_TIME),
      carPosition: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.POS),
      currentLapNum: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.NUM),
    };
  }
}
