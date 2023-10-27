export class Stream {
    distance : {
        data: number[]
        original_size: number
        resolution: string
        series_type: string
    } | undefined;
    heartrate : {
        data: number[]
        original_size: number
        resolution: string
        series_type: string
    } | undefined;
    time : {
        data: number[]
        original_size: number
        resolution: string
        series_type: string
    } | undefined;
    watts : {
        data: number[]
        original_size: number
        resolution: string
        series_type: string
    } | undefined
}

class range {
    max : number = 0;
    min : number = 0;
    time : number = 0;
}
export class Zones {
    distribution_buckets : range[] = [];
    type? : string;
    resource_state?: number;
    sensor_based? : boolean
}
