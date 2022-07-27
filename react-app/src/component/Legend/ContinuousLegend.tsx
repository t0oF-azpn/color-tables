import * as React from "react";
import { useRef } from "react";
import {
  RGBToHex,
  colorsArray,
  RGBToHexValue,
} from "../Utils/legendCommonFunction";
import { select, scaleLinear, scaleSymlog, axisBottom, axisRight } from "d3";
import { d3ColorScales } from "../Utils/d3ColorScale";
import { color } from "d3-color";
import { range } from "d3";
import { colorTablesArray } from "../colorTableTypes";
import defaultColorTables from "../color-tables.json";

declare type continuousLegendProps = {
  /**
   * Min value
   */
  min: number;
  /**
   * Max value
   */
  max: number;
  /**
   * Title for the legend
   */
  dataObjectName: string;
  /**
   * Specify the position
   */
  position?: number[] | null;
  /**
   * Name of the color(ex: Rainbow)
   */
  colorName?: string;
  /**
   * Orientation for legend
   */
  horizontal?: boolean | null;
  /**
   * Used while using color selector component
   *
   * Returns the object with name and array of colors
   */
  getColorScaleData?: any;
  /**
   * ID
   */
  id?: string;
  /**
   * Prop containing color table data
   *
   * Reference: https://github.com/emerson-eps/color-tables/blob/main/react-app/src/component/color-tables.json
   */
  colorTables?: colorTablesArray;
  /**
   * Optional function property
   *
   * Takes a value in the range [0,1] and returns a color
   *
   * If a colorMapFunction is used, then the colorTable file is not needed
   */
  colorMapFunction?: any;
  /**
   * Reverse the range(min and max)
   */
  reverseRange?: boolean;
  isLinear?: boolean;
};

declare type ItemColor = {
  color: string;
  offset: number;
  testOffset: any;
};

export const ContinuousLegend: React.FC<continuousLegendProps> = ({
  min,
  max,
  dataObjectName,
  position,
  colorName = "Rainbow",
  horizontal,
  getColorScaleData,
  id,
  colorTables = defaultColorTables as colorTablesArray,
  colorMapFunction,
  reverseRange,
  isLinear = true,
}: continuousLegendProps) => {
  const generateUniqueId = Math.ceil(Math.random() * 9999).toString();
  const divRef = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (divRef.current) {
      select(divRef.current).select("div").remove();
      select(divRef.current).select("svg").remove();
      continuousLegend();
    }

    async function continuousLegend() {
      const itemColor: ItemColor[] = [];
      let dataSet;

      try {
        // fix for dash wrapper
        if (typeof colorTables === "string") {
          const res = await fetch(colorTables);
          dataSet = await res.json();
        }
        //Return the matched colors array from color.tables.json file
        let legendColors =
          typeof colorTables === "string"
            ? colorsArray(colorName, dataSet)
            : colorsArray(colorName, colorTables);

        // Update color of legend based on color selector scales
        // data is passed on click upon color scales
        if (getColorScaleData && Object.keys(getColorScaleData).length > 0) {
          // legend using color table data
          if (getColorScaleData.color) {
            legendColors = getColorScaleData.color;
          }
          // legend using d3 data
          else if (getColorScaleData.arrayData) {
            legendColors = getColorScaleData.arrayData;
          }
        }
        // main continuous legend for d3 colors
        if (legendColors.length === 0) {
          const arrayData: any = [];
          const d3ColorArrays = colorsArray(colorName, d3ColorScales);
          const data = range(10).map((d) => ({ color: d3ColorArrays(d / 10) }));
          data.forEach((colorsObject: any, index: number) => {
            arrayData.push([
              0 + "." + index,
              color(colorsObject.color)?.rgb().r,
              color(colorsObject.color)?.rgb().g,
              color(colorsObject.color)?.rgb().b,
            ]);
          });
          legendColors = arrayData;
        }

        // condition to check if the legend is selected from color selector or not
        const getColorTableScale = colorTables.find((value: any) => {
          if (getColorScaleData) {
            return value.name === getColorScaleData?.name;
          } else {
            return value.name === colorName;
          }
        });

        const maxValue = legendColors.length - 1;

        // if colorMapFunction prop is passed
        if (colorMapFunction) {
          let rgbValue: any = [];
          for (var i = 0; i <= 1; i += 0.05) {
            const value = colorMapFunction(i);
            rgbValue.push([i.toFixed(2), value[0], value[1], value[2]]);
          }
          legendColors = rgbValue;
        }
        // let breakpoint = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
        // let itemVale: any
        // breakpoint.forEach(function (item) {itemVale = item});
        legendColors.forEach((value: [number, number, number, number]) => {
          // return the color and offset needed to draw the legend
          itemColor.push({
            // to support discrete color for continous data
            offset:
              getColorTableScale?.discrete === true
                ? RGBToHexValue(value, maxValue).offset
                : RGBToHex(value).offset,
            color: RGBToHex(value).color,
            testOffset: value[0], // gives the first point
          });
        });

        const width = 150;
        const colorScale = isLinear
          ? scaleLinear().domain([min, max]).range([0, width])
          : scaleSymlog().domain([min, max]).range([0, width]);
        //scaleSymlog().domain([Math.log(min), Math.log(max)]).clamp(true).range([0, width]);

        // create an svg of specific width and height
        const svgLegend = select(divRef.current)
          .style("margin-right", "2px")
          .style("margin-left", "2px")
          .append("svg")
          .style("background-color", "#ffffffcc")
          .style("border-radius", "5px")
          .attr("width", horizontal ? width + 50 : "77")
          .attr("height", horizontal ? "70" : "173");

        let linearGradient = svgLegend
          .append("defs")
          .append("linearGradient")
          .attr("id", "linear-gradient-" + id + "0");
        // append a linearGradient element to the defs and give it a unique id
        if ((horizontal && !reverseRange) || (!horizontal && reverseRange)) {
          linearGradient
            .attr("x1", "0%")
            .attr("x2", horizontal ? "100%" : "0%")
            .attr("y1", "0%")
            .attr("y2", horizontal ? "0%" : "100%");
        } else if (
          (!horizontal && !reverseRange) ||
          (horizontal && reverseRange)
        ) {
          linearGradient
            .attr("x1", horizontal ? "100%" : "0%")
            .attr("x2", "0%")
            .attr("y1", horizontal ? "0%" : "100%")
            .attr("y2", "0%");
        }
        // append multiple color stops by using D3's data/enter step
        linearGradient
          .selectAll("stop")
          .data(itemColor)
          .enter()
          .append("stop")
          .attr("offset", function (data) {
            // return colorScale(data.testOffset) / 1.5 + "%";
            return colorScale(min + data.testOffset * (max - min)) / 1.5 + "%";
            //return (isLinear ? data.offset + "%" : colorScale(min + (data.testOffset * (max - min))) / 4 + "%");
          })
          .attr("stop-color", function (data) {
            return data.color;
          });

        // draw the rectangle and fill with gradient
        svgLegend
          .append("rect")
          .attr("x", 16)
          .attr("y", horizontal ? 30 : 18)
          .attr("width", horizontal ? width : 20)
          .attr("height", horizontal ? 20 : "149")
          // eslint-disable-next-line
          .style("fill", "url(#" + "linear-gradient-" + id + "0" + ")");

        // append title
        svgLegend
          .append("text")
          .attr("x", horizontal ? 25 : -168)
          .attr("y", horizontal ? 20 : 10)
          .style("text-anchor", "left")
          .style("transform", horizontal ? "none" : "left")
          .style("transform", horizontal ? "none" : "rotate(270deg)")
          .style("fill", "grey")
          .style("font-size", "small")
          .text(dataObjectName);

        // create tick marks
        // range varies the size of the axis
        let xLeg = scaleLinear()
          .domain(reverseRange ? [max, min] : [min, max])
          .range([0, width]);
        let yLeg = scaleLinear()
          .domain(reverseRange ? [min, max] : [max, min])
          .range([0, width]);

        const horizontalAxisLeg = axisBottom(xLeg).tickValues(
          colorScale.domain()
        );
        const VerticalAxisLeg = axisRight(yLeg)
          .tickSize(20)
          .tickValues(colorScale.domain());

        svgLegend
          .attr("class", "axis")
          .append("g")
          .attr(
            "transform",
            horizontal ? "translate(16, 50)" : "translate(15.5, 17.5)"
          )
          .style("font-size", "10px")
          .style("font-weight", "700")
          .call(horizontal ? horizontalAxisLeg : VerticalAxisLeg)
          .style("height", 15);
      } catch (error) {
        console.error(error);
      }
    }
  }, [
    min,
    max,
    colorName,
    colorTables,
    horizontal,
    getColorScaleData,
    colorMapFunction,
    dataObjectName,
    id,
    reverseRange,
    isLinear,
  ]);
  return (
    <div
      style={{
        right: position ? position[0] : " ",
        top: position ? position[1] : " ",
        zIndex: 999,
      }}
    >
      <div
        id={id ? id : `cont-legend - ${generateUniqueId}`}
        ref={divRef}
      ></div>
    </div>
  );
};

ContinuousLegend.defaultProps = {
  position: [5, 10],
};
