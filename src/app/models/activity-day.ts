import {MetaAthlete} from "./meta-athlete";
import {ActivityType} from "./activity-type";
import {PolylineMap} from "./polyline-map";
import {SummaryActivity} from "./summary-activity";

export class ActivitySession {
  type?: ActivityType;
  name: string = "";
  activity: SummaryActivity | undefined;
}
export class ActivityDay {
  duration: number = 0;
  kcal: number = 0;
  day?: Date;
  average_heartrate?: number;
  hr_max?: number;
  sessions: ActivitySession[]= [];
}
