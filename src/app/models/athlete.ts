import {ResourceState} from "./ResourceState";
import {Sex} from "./sex";


export interface Athlete {
  id: number;
  resource_state: ResourceState;
  firstname: string;
  lastname: string;
  profile_medium: string;
  profile: string;
  city: string;
  state: string;
  country: string;
  sex: Sex;
  friend: string;
  follower: string;
  premium: boolean;
  created_at: Date;
  updated_at: Date;
  ftp?: number;
  weight?: number;
}
