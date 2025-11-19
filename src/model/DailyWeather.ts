import { DateTime } from "luxon";

export interface DailyWeather
{
    id:number;
    created_at:DateTime;
    weather_time:DateTime;
    high:number;
    low:number;
    weather_code:string;
    moon_phase:string;
    sunrise_time:DateTime;
    sunset_time:DateTime;
}