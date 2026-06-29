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
  lastLapTimeInMS: number;
  currentLapTimeInMS: number;
  sector1TimeMSPart: number;
  sector1TimeMinutesPart: number;
  sector2TimeMSPart: number;
  sector2TimeMinutesPart: number;
  deltaToCarInFrontMSPart: number;
  deltaToCarInFrontMinutesPart: number;
  deltaToRaceLeaderMSPart: number;
  deltaToRaceLeaderMinutesPart: number;
  lapDistance: number;
  totalDistance: number;
  safetyCarDelta: number;
  carPosition: number;
  currentLapNum: number;
  pitStatus: number;
  numPitStops: number;
  sector: number;
  currentLapInvalid: number;
  penalties: number;
  totalWarnings: number;
  cornerCuttingWarnings: number;
  numUnservedDriveThroughPens: number;
  numUnservedStopGoPens: number;
  gridPosition: number;
  driverStatus: number;
  resultStatus: number;
  pitLaneTimerActive: number;
  pitLaneTimeInLaneInMS: number;
  pitStopTimerInMS: number;
  pitStopShouldServePen: number;
  speedTrapFastestSpeed: number;
  speedTrapFastestLap: number;
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
  // TIME
  LAST_LAP_MS: 0,
  CURR_LAP_MS: 4,
  S1_MS: 8,
  S1_MIN: 10,
  S2_MS: 11,
  S2_MIN: 13,

  // DELTA
  DELTA_FRONT_MS: 14,
  DELTA_FRONT_MIN: 16,
  DELTA_LEADER_MS: 17,
  DELTA_LEADER_MIN: 19,

  // DISTANCE
  LAP_DIST: 20,
  TOTAL_DIST: 24,

  // SC DELTA
  SC_DELTA: 28,

  // POSITION / LAP NUMBER
  POS: 32,
  LAP_NUM: 33,

  // PIT STOP
  PIT_STATUS: 34,
  PIT_STOPS: 35,
  PIT_LANE_ACTIVE: 46,
  PIT_LANE_MS: 47,
  PIT_STOP_MS: 49,
  PIT_SERVES_PEN: 51,

  // SECTOR / VALID
  SECTOR: 36,
  LAP_INVALID: 37,

  // PENALTY / WARNING
  PENALTY_SEC: 38,
  WARNINGS: 39,
  CUT_WARNINGS: 40,
  DRIVE_THRU_LEFT: 41,
  STOP_GO_LEFT: 42,

  // DRIVER STATUS
  GRID_POS: 43,
  DRIVER_STATUS: 44,
  RESULT_STATUS: 45,

  // SPEED TRAP
  SPEED_TRAP_KPH: 52,
  SPEED_TRAP_LAP: 56,
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

class TelemetryParser {
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
      lastLapTimeInMS: msg.readUInt32LE(myCarStart + TELEMETRY_LAP_OFFSET.LAST_LAP_MS),
      currentLapTimeInMS: msg.readUInt32LE(myCarStart + TELEMETRY_LAP_OFFSET.CURR_LAP_MS),
      sector1TimeMSPart: msg.readUInt16LE(myCarStart + TELEMETRY_LAP_OFFSET.S1_MS),
      sector1TimeMinutesPart: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.S1_MIN),
      sector2TimeMSPart: msg.readUInt16LE(myCarStart + TELEMETRY_LAP_OFFSET.S2_MS),
      sector2TimeMinutesPart: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.S2_MIN),
      deltaToCarInFrontMSPart: msg.readUInt16LE(myCarStart + TELEMETRY_LAP_OFFSET.DELTA_FRONT_MS),
      deltaToCarInFrontMinutesPart: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.DELTA_FRONT_MIN),
      deltaToRaceLeaderMSPart: msg.readUInt16LE(myCarStart + TELEMETRY_LAP_OFFSET.DELTA_LEADER_MS),
      deltaToRaceLeaderMinutesPart: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.DELTA_LEADER_MIN),
      lapDistance: msg.readFloatLE(myCarStart + TELEMETRY_LAP_OFFSET.LAP_DIST),
      totalDistance: msg.readFloatLE(myCarStart + TELEMETRY_LAP_OFFSET.TOTAL_DIST),
      safetyCarDelta: msg.readFloatLE(myCarStart + TELEMETRY_LAP_OFFSET.SC_DELTA),
      carPosition: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.POS),
      currentLapNum: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.LAP_NUM),
      pitStatus: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.PIT_STATUS),
      numPitStops: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.PIT_STOPS),
      sector: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.SECTOR),
      currentLapInvalid: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.LAP_INVALID),
      penalties: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.PENALTY_SEC),
      totalWarnings: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.WARNINGS),
      cornerCuttingWarnings: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.CUT_WARNINGS),
      numUnservedDriveThroughPens: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.DRIVE_THRU_LEFT),
      numUnservedStopGoPens: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.STOP_GO_LEFT),
      gridPosition: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.GRID_POS),
      driverStatus: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.DRIVER_STATUS),
      resultStatus: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.RESULT_STATUS),
      pitLaneTimerActive: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.PIT_LANE_ACTIVE),
      pitLaneTimeInLaneInMS: msg.readUInt16LE(myCarStart + TELEMETRY_LAP_OFFSET.PIT_LANE_MS),
      pitStopTimerInMS: msg.readUInt16LE(myCarStart + TELEMETRY_LAP_OFFSET.PIT_STOP_MS),
      pitStopShouldServePen: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.PIT_SERVES_PEN),
      speedTrapFastestSpeed: msg.readFloatLE(myCarStart + TELEMETRY_LAP_OFFSET.SPEED_TRAP_KPH),
      speedTrapFastestLap: msg.readUInt8(myCarStart + TELEMETRY_LAP_OFFSET.SPEED_TRAP_LAP),
    };
  }
}

export default TelemetryParser;
