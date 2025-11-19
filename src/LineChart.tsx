import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";

const MARGIN = { top: 30, right: 30, bottom: 50, left: 40 };

type DataPoint = { x: Date; y: number };
type LineChartProps = {
    width: number;
    height: number;
    data: DataPoint[];
};

export const LineChart = ({ width, height, data }: LineChartProps) => {
    // bounds = area inside the graph axis = calculated by substracting the margins
    const axesRef = useRef(null);
    const boundsWidth = width - MARGIN.right - MARGIN.left;
    const boundsHeight = height - MARGIN.top - MARGIN.bottom;

    // Y axis
    const [yMin, yMax] = d3.extent(data, (d) => d.y);
    const yScale = useMemo(() => {
        return d3
            .scaleLinear()
            .domain([(yMin??0) *0.1, yMax || 0])
            .range([boundsHeight, 0])
            .nice();
    }, [data, height]);

    //console.log(`temp extent: ${yMin} ${yMax}`);

    // X axis
    const [xMin, xMax] = d3.extent(data, (d) => new Date(d.x));
    //console.log("date extent: " + xMin + xMax);
    const xScale = useMemo(() => {
        return d3
            .scaleTime()
            .domain([xMin || 0, d3.timeHour.offset(xMax as Date,1) || 0])
            .range([0, width])
            .nice();
    }, [data, width]);

    useEffect(() => {
        const svgElement = d3.select(axesRef.current);
        svgElement.selectAll("*").remove();


        const xAxis = d3
            .axisBottom(xScale)
            .tickSize(10)
            .tickSizeOuter(0)
            .ticks(data.length / 2)
            //@ts-ignore 2769
            .tickFormat(d3.timeFormat("%_I%p"))
            .tickPadding(20);

        // Add the X Axis
        svgElement
            .append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(${0}, ${height - MARGIN.bottom - MARGIN.top})`)
            .attr("font-weight", "50")
            .attr("font-family", '"Roboto", "sans-serif"')
            .call(xAxis, 0);

        const yAxisGenerator = d3.axisLeft(yScale);

        svgElement.append("g").call(yAxisGenerator);

        //Datapoints
    svgElement.selectAll("circle.point")
        .data(data)
        .join(
            enter => enter.append("circle").attr("class", "point"),
            update => update,
            exit => exit.remove()
        )
        .attr("r", 5)
        .attr("cx", (d) => xScale(d.x.valueOf()))
        .attr("cy", (d) => yScale(d.y))
        .attr("stroke", "#000000")
        .attr("fill", "#000000");

        // Create the circle that travels along the curve of chart

        const focus = svgElement
            .append("g")
            .append("circle")
            .style("fill", "none")
            .attr("stroke", "black")
            .attr("r", 20)
            .style("opacity", 0);

        // Create the text that travels along the curve of chart
        const focusText = svgElement
            .append("g")
            .append("text")
            .style("opacity", 0)
            .attr("text-anchor", "left")
            .attr("alignment-baseline", "middle")
            .attr("text-wrap","wrap");

        svgElement
            .append("rect")
            .style("fill", "none")
            .style("pointer-events", "all")
            .attr("width", width)
            .attr("height", height)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseout", mouseout);

        // What happens when the mouse move -> show the annotations at the right positions.
        function mouseover() {
            focus.style("opacity", 100);
            focusText.style("opacity", 100);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function mousemove(event: any) {
            // recover coordinate we need
            //d3.pointer(event)[0] is the x pixel location
            //xScale.invert(d3.pointer(event)[0]) provides the correct date for indexing in to the dates
            const mousePoint = d3.pointer(event)[0];
            const x0 = xScale.invert(mousePoint);

            //console.log(`x0=${x0} ${mousePoint}}`)
            const i = d3.bisectLeft(
                data.map((d) => d.x),
                x0
            );
          //  console.log(`i: ${i} data[i]:${data[i].x}}`);
            const selectedData = data[i];
          //  console.log(`selected Data  x:${selectedData.x} y: ${selectedData.y}`);
            focus.attr("cx", xScale(selectedData.x)).attr("cy", yScale(selectedData.y));
            focusText
                .html(`${selectedData.y}F (${selectedData.x.toLocaleTimeString()})`)
                .attr("x", xScale(selectedData.x))
                .attr("y", yScale(selectedData.y-20))
                .attr("stroke", "black");
        }
        function mouseout() {
            focus.style("opacity", 0);
            focusText.style("opacity", 0);
        }
    },[data, xScale, yScale, width, height]);

    // Build the line
    const lineBuilder = d3
        .line<DataPoint>()
        .x((d) => xScale(d.x.valueOf()))
        .y((d) => yScale(d.y));

    const linePath = lineBuilder(data);
    if (!linePath) {
        return null;
    }

    return (
        <div style={{float:'left'}}>
            <svg
                width={width}
                height={height}
            >
                <g
                    width={boundsWidth}
                    height={boundsHeight}
                    transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
                >
                    <path
                        d={linePath}
                        stroke="#FFFFFF"
                        fill="none"
                        strokeWidth={2.5}
                    />
                </g>
                <g
                    width={boundsWidth}
                    height={boundsHeight}
                    ref={axesRef}
                    transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
                />
            </svg>
        </div>
    );
};
