import { DateTime, Interval } from "luxon";
import { useState, useEffect } from 'react';
import { DailyWeather } from './model/DailyWeather';
import { HourlyWeather } from './model/HourlyWeather';

const WeatherOverview = () => {
  
  const [hourly, setHourly] = useState<Array<HourlyWeather>>();
  const [daily, setDaily] = useState<Array<DailyWeather>>();

  const [dailyMedian, setDailyMedian] = useState(0);
  const [dailyHigh, setDailyHigh] = useState(0);
  const [dailyLow, setDailyLow] = useState(0);

  const [today, setToday] = useState<DailyWeather>();
  const [lastHourlyPull, setLastHourlyPull] = useState<DateTime>();
  const [lastDailyPull, setLastDailyPull] = useState<DateTime>(DateTime.now);

  const [healthStatus, setHealthStatus] = useState("");
  const [healthStatusTime, setHealthStatusTime] = useState<DateTime>();

  const [inst, setInst] = useState(0);
  const [instTimestamp, setInstTimestamp] = useState<DateTime>(DateTime.now);

  let forecastURL = "192.168.1.5";
  let forecastPort = 3031;

  useEffect(() => {
    if (daily === undefined) {
      loadData();
    }
  }, []);

  async function loadData() {
    await getDaily();
    await getWeather();
    await getInst();
  }

  async function getWeather() {
    var requestOptions = {
      method: 'get'
    };

    const resp = await fetch(`http://${forecastURL}:${forecastPort}/forecast/hourly`, requestOptions);

    if (!resp.ok) {
      const msg = `Something happened: ${resp.status} ${await resp.text()}`;
      throw new Error(msg);
    }

    const weatherdata: HourlyWeather[] = await resp.json();

    setHourly(weatherdata);
    const todaysTemps = weatherdata.map(t => t.temp);

    setDailyHigh(Math.max.apply(Math, todaysTemps));
    setDailyLow(Math.min.apply(Math, todaysTemps));
    setDailyMedian(todaysTemps.reduce((a, b) => a + b, 0) / todaysTemps.length);
    setLastHourlyPull(weatherdata[0].created_at);

    const health = await fetch(`http://${forecastURL}:${forecastPort}/forecast/healthcheck`, requestOptions);
    setHealthStatus(health.statusText);
    if (health.status == 200) {
      setHealthStatusTime(DateTime.now());
    }
  }

  async function getInst() {
    var requestOptions = {
      method: 'get'
    };

    const resp = await fetch(`http://${forecastURL}:${forecastPort}/forecast/instant`, requestOptions);

    if (!resp.ok) {
      const msg = `Something happened: ${resp.status} ${await resp.text()}`;
      throw new Error(msg);
    }

    const weatherdata = await resp.json();

    setInst(weatherdata.observations[0].imperial.temp);
    setInstTimestamp(weatherdata.observations[0].obsTimeUtc);
  }

  async function getDaily() {
    var requestOptions = {
      method: 'get'
    };

    const resp = await fetch(`http://${forecastURL}:${forecastPort}/forecast/daily`, requestOptions);

    if (!resp.ok) {
      const msg = `Something happened: ${resp.status} ${await resp.text()}`;
      throw new Error(msg);
    }

    const weatherdata: DailyWeather[] = await resp.json();

    setDaily(weatherdata);

    console.log('weather'+weatherdata.toString());
    
    setToday(weatherdata.filter(day => DateTime.fromISO(String(day.weather_time)).hasSame(DateTime.now(), 'day'))[0] || null);
    
    console.log('today:'+today?.toString());
    
    setLastDailyPull(weatherdata[0].created_at);

    const health = await fetch(`http://${forecastURL}:${forecastPort}/forecast/healthcheck`, requestOptions);
    setHealthStatus(health.statusText);

    if (health.status == 200) {
      setHealthStatusTime(DateTime.now());
    }
  }

  function getDisplayString(word: string) {
    return word.replace("_", " ");
  }

  function getWeatherImg(conditions: string, timeOfDay: string) {

    //return "assets/001-sunny.png";
    let dayTime = true;

    if (timeOfDay != null && today != null) {
      let hour = DateTime.fromISO(timeOfDay).hour;
      dayTime = hour > DateTime.fromISO(today.sunrise_time.toString()).hour && hour < DateTime.fromISO(today.sunset_time.toString()).hour;
    }

    conditions = conditions.toLowerCase();

    if (conditions.includes("partly") || conditions.includes("mostly")) {
      return dayTime ? "assets/011-sunny.png" : "assets/013-full moon.png";
    }
    else if (conditions.includes("cloud")) {
      return dayTime ? "assets/002-cloud.png" : "assets/013-full moon.png";
    }

    if (conditions.includes("rain") || conditions.includes("drizzle")) {
      return "assets/004-rain.png";
    }

    if (conditions.includes("fog")) {
      return dayTime ? "assets/019-fog.png" : "assets/029-full moon.png";
    }

    if (conditions.includes("snow") || conditions.includes("flurries")) {
      return "assets/007-snow.png";
    }

    if (conditions.includes("wind")) {
      return "assets/012-windy.png";
    }

    if (conditions.includes("hail")) {
      return "assets/014-hail.png";
    }

    if (conditions.includes("sleet")) {
      return "assets/027-sleet.png";
    }

    if (conditions.includes("storm")) {
      return "assets/006-thunder.png";
    }

    return dayTime ? "assets/001-sunny.png" : "assets/008-full moon.png";

  }

  function getDailyHiLowGradient(temp: number) {
    if (temp === dailyHigh) {
      return "#f29e66";
    }

    if (temp === dailyLow) {
      return "#35d7f0";
    }

    if (temp < dailyMedian) {
      return "#aff0fa";
    }

    if (temp > dailyMedian) {
      return "#fcddb6";
    }

    return "#ffffff";
  }

  function getMoonImg(phase: string) {
    switch (phase) {
      case "New":
        return "assets/new-moon-phase-circle.png";
      case "Waxing_Crescent":
        return "assets/moon-phase-interface-symbol.png";
      case "First_Quarter":
        return "assets/half-moon-phase-symbol.png";
      case "Waxing_Gibbous":
        return "assets/moon-phase-symbol-9.png";
      case "Full":
        return "assets/moon-phase.png";
      case "Waning_Gibbous":
        return "assets/moon-phase-symbol-14.png";
      case "Third_Quarter":
        return "assets/moon-phase-symbol-3.png";
      case "Waning_Crescent":
        return "assets/moon-phase-symbol-12.png";
      default:
        return "assets/new-moon-phase-circle.png";
    };

  }

  function getdailyRows() {
    
    let dailyRows:JSX.Element[]=[];
    
    if (daily !== undefined) {

      daily.map((thing) => {

        dailyRows.push(<tr>
          <td>{new Date(thing.weather_time.toString()).toLocaleDateString("en-us", { weekday: 'short', month: 'numeric', day: 'numeric' })}</td>
          <td>{thing.high} F - {thing.low} F</td>
          <td><img src={getWeatherImg(thing.weather_code, thing.weather_time.toString())} height="24" width="24" style={{ float: "left", margin: "0px 15px 0px 5px" }} /> {getDisplayString(thing.weather_code)}</td>
          <td><img src={getMoonImg(thing.moon_phase)} height="24" width="24" style={{ float: "left", margin: "0px 15px 0px 5px" }} /> {getDisplayString(thing.moon_phase)}</td>
        </tr>);
      })

    }

    return dailyRows;

  }

  function getHealthcheckTimestamp(){

    if(healthStatusTime!== undefined)
    {
      return <span className='timestamp'>Health Status: <span className={healthStatus == 'OK' ? 'greenbubble' : 'redbubble'} />{healthStatus} ({new Date(healthStatusTime.toString()).toLocaleDateString("en-us", { hour: "2-digit", minute: "2-digit" })})</span>
    }
    else{
      return <span/>
    }
            
  }

  function getTodaysDate(){
    if(today!== undefined)
    {
      return new Date(today.weather_time.toString()).toLocaleDateString("en-us", { month: "2-digit", day: "2-digit" });
    }
    else{
      return new Date(Date.now()).toLocaleDateString("en-us",{ month: "2-digit", day: "2-digit" });
    }
  }

  function getSunriseData(){
    
    console.log(today?.toString());
    if(today!==undefined && lastHourlyPull!==undefined)
    {
      const sunRiseTime = DateTime.fromISO(today.sunrise_time.toString());
      const sunSetTime = DateTime.fromISO(today.sunset_time.toString());
      const duration = Interval.fromDateTimes(sunRiseTime, sunSetTime).length('minutes');
      
      let durationStr = `${(duration / 60).toFixed()}h ${duration % 60}m`;
      return (<span style={{ color: "black", fontSize: "small", float: "right" }}>
      <span className='timestamp'>{new Date(lastHourlyPull.toString()).toLocaleDateString("en-us", { hour: "2-digit", minute: "2-digit" })}</span>
      <br />
      <span style={{ color: "dimgrey", fontSize: "xx-small" }}>{durationStr}</span>&nbsp;
      <img src="assets/015-sunrise.png" height="25" width="25" /> {sunRiseTime.toLocaleString(DateTime.TIME_SIMPLE)}
      <img src="assets/016-sunset.png" height="25" width="25" /> {sunSetTime.toLocaleString(DateTime.TIME_SIMPLE)} </span>);
    }
  }

  function getHourlyRows(){

    let hourlyRows:JSX.Element[]=[];
    
    if (hourly !== undefined) {

    hourly.map((thing) => {
      hourlyRows.push(<tr>
        <td>{new Date(thing.weather_time.toString()).toLocaleTimeString("en-us", { hour: "2-digit", minute: "2-digit" })}</td>
        <td style={{ backgroundColor: getDailyHiLowGradient(thing.temp) }}>{thing.temp} F</td>
        <td><img src={getWeatherImg(thing.weather_code, thing.weather_time.toString())} height="24" width="24" style={{ float: "left", margin: "0px 15px 0px 5px" }} /> {getDisplayString(thing.weather_code)}</td>
        <td style={{ backgroundColor: getDailyHiLowGradient(thing.temp) }}>{thing.feels_like} F</td>
        {/*<td>{thing.precipitation_chance}% chance of {thing.precipitation_type}</td>*/}
        <td>{thing.humidity}%</td>
        <td>{thing.dew_point}F</td>
      </tr>);
    });

  }
    return hourlyRows;
  }

  
  
  return (
  <div className="WeatherOverview">

    <h1>Weather Data</h1>
    <h3>{inst} °F <span className='timestamp' style={{ float: 'none' }}>({DateTime.fromISO(instTimestamp!.toString()).toLocaleString(DateTime.TIME_SIMPLE)})</span></h3>
    <table className="layoutTable" align="center" >
      <tr>
        <td className="layoutTable">
          {/*Daily Table*/}
          <br />
          <table className="dataTable">
            <thead>
              <tr><th colSpan={4}>7-day Forecast <span className='timestamp'>{new Date(lastDailyPull!.toString()).toLocaleDateString("en-us", { hour: "2-digit", minute: "2-digit" })}</span></th></tr>
              <tr>
                <th>Day</th>
                <th>Hi-Lo</th>
                <th>Weather</th>
                <th>Moon</th>
              </tr>
            </thead>
            <tbody>
              {getdailyRows()}
            </tbody>
          </table>
        </td>

        <td className="layoutTable">
          {/*Hourly Table*/}
          {getHealthcheckTimestamp()}
          <br />
          <table className="dataTable">
            <thead>
              <tr><th colSpan={7}>{getTodaysDate()} (Hourly)
                {getSunriseData()}
              </th></tr>
              <tr>
                <th>Hour</th>
                <th>Temp</th>
                <th>Weather</th>
                <th>Feel</th>
                {/*<th>Precipitation</th>*/}
                <th>Humidity</th>
                <th>Dew Point</th>
              </tr>
            </thead>
            <tbody>
              {getHourlyRows()}
            </tbody>
          </table>
        </td>
      </tr>
    </table>
    <div> Weather icons made by <a href="https://www.flaticon.com/authors/smashicons" title="Smashicons">Smashicons</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
    <div>Moon icons made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
  </div>
    );
  }
  
  export default WeatherOverview;