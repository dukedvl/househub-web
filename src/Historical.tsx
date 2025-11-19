import { useState, useEffect } from "react";
import { LineChart } from "./LineChart";

interface HistoricalPt {
  obsTimeLocal: Date;
  temp: number;
}

const Historical = () => {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10)); 
    const [myNewData, setMyNewData] = useState<Array<{ x: Date; y: number }>>([]);

    useEffect(() => {
      async function getData(): Promise<string> {
        const resp = await fetch(
          `http://192.168.1.5:3031/forecast/historical?search_type=daily&day=${selectedDate}`
        );
  
        if (resp.ok) {
          const response = await resp.json();
          console.log(response);
          setMyNewData(response.map((x:HistoricalPt) => ({ x: new Date(x.obsTimeLocal), y: x.temp })).sort((a: {x:Date}, b: {x:Date}) => a.x.getTime() - b.x.getTime()));
        }
        else{
          setMyNewData([])
        }
        return "ok";
      }
      
      getData();

    console.log("getting data for: " + selectedDate);
    }, [selectedDate]);
  
    
  
    
    return (
      <>
        <div style={{float:'left'}}>
          <span>Date: <input type='date' value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} ></input></span>
          <LineChart data={myNewData} width={1500} height={700} />
        </div>
      </>
    );
  }
  
  export default Historical;