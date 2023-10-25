import {ResourceState} from "./ResourceState";
import {Sex} from "./sex";

class range {
  min: number = 0;
  max?: number = 0
}
export interface hrZone {
  calculated?: boolean;
  maximumHR?: number;
  z1?: range;
  z2?: range;
  z3?: range;
  z4?: range;
  z5?: range;
}
export interface pwrZone {
  calculated?: boolean;
  ftp?: number;
  z1?: range;
  z2?: range;
  z3?: range;
  z4?: range;
  z5?: range;
  z6?: range;
  z7?: range;
}
export interface Person {

  id?: number;
  resource_state?: ResourceState;
  firstname?: string;
  lastname?: string;
  profile_medium?: string;
  profile?: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: Sex;
  friend?: string;
  follower?: string;
  premium?: boolean;
  created_at?: Date;
  updated_at?: Date;
  ftp?: number;
  weight?: number;
  hrzones?: hrZone;
  age?: number;
  height?: number;
  waist?: number;
  ethnic?: string;
}
