// basic chart https://bl.ocks.org/mbostock/3885304
// Tooltip: http://bl.ocks.org/d3noob/a22c42db65eb00d4e369
function createChart(error, data) {
  if (error) throw error;

  var header = data.indexOf('STN,YYYYMMDD');
  var endHeader = data.indexOf('\n', header);
  var parseDate= d3.timeParse("%Y%m%d");


  data = data.slice(endHeader);
  data = data.replace('#', '').trim();
  data = data.replace(/ +/g, '');

  var cleanedData = d3.csvParseRows(data, map)

  function map(d) {
    return {
      date: parseDate(d[1]),
      sunHours: parseInt(d[18]),
      rainPerDay: parseInt(d[20]),
    }
  }

  cleanedData.forEach(function(d) {
    d.date = d.date.toString().substring(3);
    d.date = d.date.split('00:00:00');
    d.date = d.date.splice(0,1).toString().trim();
    d.rainPerDay = +d.rainPerDay;
  });

  console.log(cleanedData)

  const svg = d3.select("svg");
  const margin = {top: 100, right: 50, bottom: 120, left: 80};
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;

  const xScale = d3.scaleBand().rangeRound([0, width]).padding(0.1);
  const yScale = d3.scaleLinear().rangeRound([height, 0]);

  const g = svg.append("g")
    .attr("transform", `translate( ${margin.left},${margin.top} )`);

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
      .style("font-size", "13px");

    // create y axis
  g.append("g")
    .attr("class", "axis axis--y")
    .call(d3.axisLeft(yScale))
  .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("dy", "0.71em")
    .attr("text-anchor", "end")
    .text("Regen per dag in 0.1 mm")
    .style("font-size", "13px")
    .style("fill", "black");

  // create bars
  g.selectAll(".bar")
    .data(cleanedData)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.date))
      .attr("y", d => yScale(d.rainPerDay))
      .attr("width", xScale.bandwidth())
      .attr("height", function(d) { return height - yScale(d.rainPerDay)})
      .on("mouseover", function(d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(`
          <div class="tooltip__item"><strong>date:</strong> ${d.date}</div>
          <div class="tooltip__item"><strong>rainPerDay:</strong> ${d.rainPerDay}</div>
        `)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0)
      });

  d3.select('input').on('change', onchange);

  function onchange() {
    var sort = this.checked ? sortOnFrequency : sortOnLetter;
    var x0 = xScale.domain(cleanedData.sort(sort).map(function(d) { return d.date; })).copy();
    var transition = svg.transition();

    console.log(x0)

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
      console.log(d)
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

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
};

d3.text('knmi.txt', createChart);
