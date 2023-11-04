import {MeasurementSetting} from "./enums/MeasurementSetting";

export interface Observations {
  id?: string;
  day: Date;
  obsEndDate?: Date;
  measurementSetting: MeasurementSetting;
  asleep?: boolean;
  rr_average?: number;
  snoring?: number;
  apnea_hypopnea_index?: number;
  sdnn_1?: number;
  skintemp?: number;
  totalcalories?: number;


  identifierValue?: string;
  name?: string;
  weight?: number;
  height?: number;
  fat_mass?: number;
  muscle_mass?: number;
  hydration?: number;
  bone_mass?: number;
  pwv?: number;
  suffer?: number;
  energy?: number;
  average_heartrate?: number;
  heartrate?: number;
  weighted_average_watts?: number;
  distance?: number;
  duration?: number;
  intensity?: number;
  deepsleepduration?: number;
  durationtosleep?: number;
  breathing_disturbances_intensity?: number;
  lightsleepduration?: number;
  wakeupcount?: number;
  remsleepduration?: number;
  sleep_score?: number;
  diastolic?: number;
  systolic?: number;
  recoverypoints?: number;
  sdnn?: number;
  vo2max?: number;
  spo2?: number;
  pi?: number;
  steps?: number;
  calories?: number;
  sleep_duration?: number;
  bodytemp?: number;

  hr_average? : number;
  hr_min? : number;
  hr_max? : number;
  hrv?: number;
  sleepScore? : number;
 // not suported in strava calories? : number;
  /*
  1	Weight (kg)
  4	Height (meter)
  5	Fat Free Mass (kg)
  76	Muscle Mass (kg)
  77	Hydration (kg)
  88	Bone Mass (kg)
  91	Pulse Wave Velocity (m/s) */
}
