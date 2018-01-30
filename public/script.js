// basic chart https://bl.ocks.org/mbostock/3885304
// Tooltip: http://bl.ocks.org/d3noob/a22c42db65eb00d4e369
function createChart(error, data) {
  if (error) throw error;

  data.forEach(function(d) {
    d.speakers = +d.speakers;
  })

  console.log(data)

  const svg = d3.select("svg");
  const margin = {top: 100, right: 20, bottom: 100, left: 80};
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;

  const xScale = d3.scaleBand().rangeRound([0, width]).padding(0.1);
  const yScale = d3.scaleLinear().rangeRound([height, 0]);

  const g = svg.append("g")
    .attr("transform", `translate( ${margin.left},${margin.top} )`);

  xScale.domain(data.map(d => d.language ));
  yScale.domain([0, d3.max(data, d => d.speakers )]);

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
    .attr("y", 6)
    .attr("dy", "0.71em")
    .attr("text-anchor", "end")
    .text("speakers")
    .style("font-size", "13px");

  // create bars
  g.selectAll(".bar")
    .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.language))
      .attr("y", d => yScale(d.speakers))
      .attr("width", xScale.bandwidth())
      .attr("height", function(d) { return height - yScale(d.speakers)})
      .on("mouseover", function(d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(`
          <div class="tooltip__item"><strong>Language:</strong> ${d.language}</div>
          <div class="tooltip__item"><strong>Speakers:</strong> ${d.speakers}</div>
        `)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0)
      });
};

const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

d3.tsv('languages.tsv', createChart);
