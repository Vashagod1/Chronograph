import { Buffer } from 'node:buffer';

const TELEMETRY_OFFSET = {
  SPEED: 29,
  THROTTLE: 31,
  STEER: 35,
  BRAKE: 39,
  CLUTCH: 43,
  GEAR: 44,
  RPM: 45,
  DRS: 47,
} as const;

export class TelemetryParser {
  static parseCarTelemetry(msg: Buffer) {
    if (msg.length < 1352) return null;
    return {
      speed: msg.readUInt16LE(TELEMETRY_OFFSET.SPEED),
      throttle: msg.readFloatLE(TELEMETRY_OFFSET.THROTTLE),
      steer: msg.readFloatLE(TELEMETRY_OFFSET.STEER),
      brake: msg.readFloatLE(TELEMETRY_OFFSET.BRAKE),
      clutch: msg.readUInt8(TELEMETRY_OFFSET.CLUTCH),
      gear: msg.readInt8(TELEMETRY_OFFSET.GEAR),
      rpm: msg.readUInt16LE(TELEMETRY_OFFSET.RPM),
      drs: msg.readUInt8(TELEMETRY_OFFSET.DRS),
    };
  }
}
