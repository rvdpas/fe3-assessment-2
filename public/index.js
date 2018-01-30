/*
Links that i've used to build this project:
basic chart https://bl.ocks.org/mbostock/3885304
Tooltip: http://bl.ocks.org/d3noob/a22c42db65eb00d4e369
Sorting: https://github.com/cmda-fe3/course-17-18/tree/master/site/class-4/sort
*/
function createChart(error, data) {
  if (error) throw error;

  const header = data.indexOf('STN,YYYYMMDD');
  const endHeader = data.indexOf('\n', header);
  const parseDate= d3.timeParse("%Y%m%d");

  data = data.slice(endHeader);
  data = data.replace('#', '').trim();
  data = data.replace(/ +/g, '');


  const cleanedData = d3.csvParseRows(data, map)

  // parse to new object so we can work with it
  function map(d) {

    // if the value is negative replace with 0, so we don't get an error
    if (d[22] < 0) {
      return;
    }

    return {
      date: parseDate(d[1]),
      minTemp: parseInt(d[12]), // parseInt so we are sure we are working with integers
      maxTemp: parseInt(d[14]),
      rainDuration: parseInt(d[21]),
      rainPerDay: parseInt(d[22]),
    }
  }

  cleanedData.forEach(d => {
    d.date = d.date.toString().substring(3); // remove day from string
    d.date = d.date.split('00:00:00'); // remove anyting starting at 00:00:00
    d.date = d.date.splice(0,1).toString().trim(); // remove second part of array and make it a string again
    d.rainPerDay = +d.rainPerDay;
  });

  // create default variables and use the margin convention: https://bl.ocks.org/mbostock/3019563
  const svg = d3.select("svg");
  const margin = {top: 50, right: 50, bottom: 120, left: 80};
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;

  // create axis
  const xScale = d3.scaleBand().rangeRound([0, width]).padding(0.1);
  const yScale = d3.scaleLinear().rangeRound([height, 0]);

 // create a wrapper
  const g = svg.append("g")
    .attr("transform", `translate( ${margin.left},${margin.top} )`);

  /*
  create the domains so the axis know how big they should be.
  xScale is going to show the dates from 1 to 30 januari of 2018
  yScale is going to show the amount of rain that fell that day in de Bilt, the Netherlands
  */
  xScale.domain(cleanedData.map(d => d.date ));
  yScale.domain([0, d3.max(cleanedData, d => d.rainPerDay )]);

  // create x axis
  g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
      .attr("y", 10)
      .attr("x", 10)
      .attr("dy", ".35em")
      .attr("transform", "rotate(45)")
      .style("text-anchor", "start")
      .style("font-size", "13px")
      .style("fill", "#fff"); // fill the label or else it's default black and you wouldn't see it.

  // wrap y axis in g element
  g.append("g")
    .attr("class", "axis axis--y")
    .call(d3.axisLeft(yScale))
  .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("dy", "0.71em")
    .attr("text-anchor", "end")
    .text("Regen per dag in 0.1 mm")
    .style("font-size", "15px")
    .style("fill", "#fff");

  // create bars
  g.selectAll(".bar")
    .data(cleanedData)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.date))
      .attr("y", d => yScale(d.rainPerDay))
      .attr("width", xScale.bandwidth())
      .attr("height", d => height - yScale(d.rainPerDay))
      .on("mouseover", d => {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(`
          <div class="tooltip__item"><strong>Datum:</strong> ${d.date}</div>
          <div class="tooltip__item"><strong>Regen per dag:</strong> ${d.rainPerDay / 10}mm</div>
        `)
        .style("left", `${d3.event.pageX}px`)
        .style("top", `${d3.event.pageY - 28}px`);
      })
      .on("mouseout", d => {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0)
      })
      .on("click", d => {
        sideInfo.html(`
          <div class="sideinfo__item"><strong>Datum:</strong> ${d.date}</div>
          <div class="sideinfo__item"><strong>Regen per dag:</strong> ${d.rainPerDay / 10} mm</div>
          <div class="sideinfo__item"><strong>Hoelang het regende:</strong> ${d.rainDuration / 10} uur</div>
          <div class="sideinfo__item"><strong>Minimale temperatuur:</strong> ${d.minTemp / 10} graden</div>
          <div class="sideinfo__item"><strong>Maximale temperatuur:</strong> ${d.maxTemp / 10} graden</div>
        `) // I've devided them by 10 because the data is in 0.1 (example: 0.1 degrees Celsius), this way I can show numbers that mean something.
      });

  // add an event listener to the checkbox that waits for a check on the input
  d3.select('input[type="checkbox"').on('change', onchange);

  const sideInfo = d3.select("body").append("div")
    .attr("class", "sideinfo")

  // check which sorting patter is used
  function onchange() {
    const sort = this.checked ? sortOnFrequency : sortOnLetter;
    const x0 = xScale.domain(cleanedData.sort(sort).map(d => d.date )).copy();
    const transition = svg.transition();

    /* Initial sort */
    svg.selectAll('.bar').sort(sortBar);

    /* Move the bars. */
    transition.selectAll('.bar')
      .delay(delay)
      .attr('x', barX0);

    /* Move the labels. */
    transition.select('.axis--x')
      .call(d3.axisBottom(xScale))
      .selectAll('g')
      .delay(delay);

    function sortBar(a, b) {
      return x0(a.date) - x0(b.date);
    }

    function barX0(d) {
      return x0(d.date);
    }

    function delay(d, i) {
      return i * 50;
    }
  }

  function change() {
    d3
      .select('input')
      .property('checked', true)
      .dispatch('change');
  }

  /* Calculate `x` for a bar. */
  function barX(d) {
    return xScale(d.date);
  }

  /* Sort on frequence. */
  function sortOnFrequency(a, b) {
    return b.rainPerDay - a.rainPerDay;
  }

  /* Sort on letters. */
  function sortOnLetter(a, b) {
    return d3.ascending(a.date, b.date);
  }

  // create tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
};

// load data and create chart
d3.text('knmi.txt', createChart);
