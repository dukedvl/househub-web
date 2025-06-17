import { DateTime } from "luxon";

export interface HourlyWeather
{
    id:number;
    created_at:DateTime;
    weather_time:DateTime;
    temp:number;
    feels_like:number;
    weather_code:string;
    precipitation_type:string;
    precipitation_chance:number;
    humidity:number;
    dew_point:number;
}