# Amount of rain that fell in Januari of 2018
This visualisation will show how much rain has fallen in the month januari of 2018 in The Netherlands.

## preview
![Preview of the chart](https://github.com/rvdpas/fe3-assessment-2/blob/master/public/preview.jpg)

## Data
The dataset I have used comes from the [KNMI](http://projects.knmi.nl/klimatologie/daggegevens/selectie.cgi) which is the National institute for measuring everything that has to do with the weather in The Netherlands. 

## Process

### Finding a good dataset
The first step i took was to find a good dataset. I've tried to use multiple datasets from the recommended dataset section, but I was a bit overwhelmed sometimes with the amount of data the came with it. So I looked further and tried a lot of different datasets. In the end I came accross the weather dataset from the [KNMI](http://projects.knmi.nl). I really liked this one because I could select my own parts of the data. I selected all the elements and as a weather station I chose 'De bilt', because this is the most central weather station in The Netherlands. 

### Cleaning the data
The first step I took was to clean the data. The dirty data looks like this:

```
260,20180101,  225,   45,   50,   90,    2,   10,   18,  190,    2,   68,   52,   24,   88,    1,   46,   24,   21,   27,  224,   69,   47,   15,    2, 9985,10021,   24, 9951,    1,   50,    2,   75,    3,    7,   84,   96,   17,   73,    1,    3
```

I couldn't really work with this data so, i started to clean it. I started with a header to show where I wanted to start to use the data. Then I showed where the data should stop and remove all the hashes in the data by replacing it with an empty string. To remove all the spaces I used the build in trim function.

```
const header = data.indexOf('STN,YYYYMMDD');
const endHeader = data.indexOf('\n', header);
const parseDate= d3.timeParse("%Y%m%d");

data = data.slice(endHeader);
data = data.replace('#', '').trim();
data = data.replace(/ +/g, '');
```

After the step above the data looked like this: 

```
260,20180101,225,45,50,90,2,10,18,190,2,68,52,24,88,1,46,24,21,27,224,69,47,15,2,9985,10021,24,9951,1,50,2,75,3,7,84,96,17,73,1,3
```

A lot better the before but not useable yet. So I used the csvParseRows to create a useable structure for the text file. I checked if the value of `d[22]` which is the amount of rain that has been fallen on the that day, is smaller than zero, which meant that there was no rain that day. If this condition was true we should return and stop that part of the function. If there was rain map create an object for the values. To make sure the string data is a correct number I used parseInt, which takes a string and returns an integer.

```
const cleanedData = d3.csvParseRows(data, map)

// parse to new object so we can work with it
function map(d) {

    // if the value is negative replace with 0, so we don't get an error
    if (d[22] < 0) {
      return;
    }

    return {
      date: parseDate(d[1]),
      minTemp: parseInt(d[12]),
      maxTemp: parseInt(d[14]),
      rainDuration: parseInt(d[21]),
      rainPerDay: parseInt(d[22]),
    }
}
  ```

The last part of the cleaning had to do with the presentation of the date. If I logged the data I got this result:

```
{date: Tue Jan 02 2018 00:00:00 GMT+0100 (West-Europa (standaardtijd)), minTemp: 45, maxTemp: 91, rainDuration: 62, rainPerDay: 45}
```

I googled for quite some time and couldn't find a good way to clean the date with D3, so i've used my own way to clean this part by cleaning it with array and string methods:

```
cleanedData.forEach(d => {
    d.date = d.date.toString().substring(3); // remove day from string
    d.date = d.date.split('00:00:00'); // remove anyting starting at 00:00:00
    d.date = d.date.splice(0,1).toString().trim(); // remove second part of array and make it a string again
    d.rainPerDay = +d.rainPerDay;
});
``` 

### Building the bar chart
At this point my data was clean and I had to pick a chart to visualize the data. After trying multiple charts, like a line chart, heatmap and bar chart. I chose the bar chart, because it looked the best with the data I had. I started with the [Blocks example](https://bl.ocks.org/mbostock/3885304) from Mike Bostock. I chose to put all code in a code that I call on the last line of my index.js. This is also where I insert my data. I think this a nicer and more organized way to keep track of your code. 

```
function createChart(error, data) {
  if (error) throw error;
  // Building the chart go's here.
};

// load data and create chart
d3.text('knmi.txt', createChart);
```

I switched the data used in the chart with my own data, that i've cleaned before. I did struggle a bit with this part, because if one thing is wrong or the output of the data was not what the chart expected then it would break. But after some debugging i got it to work. At this point I decided to use my new learned Javascript skills (ES6). I updated normal functions with arrow functions and used variables like `const` instead of `var`. This is an example of how I updated the bar with my data:

```
// create bars
g.selectAll(".bar")
    .data(cleanedData)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.date))
      .attr("y", d => yScale(d.rainPerDay))
      .attr("width", xScale.bandwidth())
      .attr("height", d => height - yScale(d.rainPerDay))
```

### Interaction
To add interaction I wanted to use multiple options interact with the data. The first one is to sort the data. I used the sorting technique used in the sorting exercise Titus Wormer [created](https://github.com/cmda-fe3/course-17-18/tree/master/site/class-4/sort). I updated this code to the standards of ES6, for example:

```
// update map function to arrow function
const x0 = xScale.domain(cleanedData.sort(sort).map(d => d.date )).copy();
```

The second interaction I added was a tooltip. This would show when you hover over the bars. I used the tooltip from this [block](http://bl.ocks.org/d3noob/a22c42db65eb00d4e369). To present the data with the tooltip, I used ES6 templating strings. 

```
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
```

The last interaction I wanted to add was for something to happen when we click on a bar. At first I thought an other way to visalize the same data would be a nice feature, but then I remembered I hadn't used a lot of data from the dataset that I downloaded. So I picked a few interesting topics and started to think of a way to present them. 

I came up with a block that presented more data ones the bar is clicked using this code:

```
.on("click", d => {
        sideInfo.html(`
            <div class="sideinfo__item"><strong>Datum:</strong> ${d.date}</div>
            <div class="sideinfo__item"><strong>Regen per dag:</strong> ${d.rainPerDay / 10} mm</div>
            <div class="sideinfo__item"><strong>Hoelang het regende:</strong> ${d.rainDuration / 10} uur</div>
            <div class="sideinfo__item"><strong>Minimale temperatuur:</strong> ${d.minTemp / 10} graden</div>
            <div class="sideinfo__item"><strong>Maximale temperatuur:</strong> ${d.maxTemp / 10} graden</div>
        `)
```

### Styling the chart
My last step was to style the chart. I have used soft blue colors to indicate the amount of rain that has fallen. 

### Todo / extend
- [ ] Option to close the popup after you've clicked a bar
- [ ] Option to select other data and update the graph
- [ ] Create different kind of charts with the same data


### Useful links
- [parseInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt)
- [Axis](https://github.com/d3/d3/blob/master/API.md#axes-d3-axis)
- [Time format](https://github.com/d3/d3/blob/master/API.md#time-formats-d3-time-format)
- [KNMI](http://projects.knmi.nl/klimatologie/daggegevens/selectie.cgi)
- [Bar chart](https://bl.ocks.org/mbostock/3885304)
- [Sort chart](https://github.com/cmda-fe3/course-17-18/tree/master/site/class-4/sort)


## Contribute to the project

To get this application working on your system, please follow the steps as described below.

### Prerequisites

```
- Installed node version 5+ 
```

### Installing

The first step is cloning the repository

```
git clone https://github.com/rvdpas/fe3-assessment-2.git
```

Then browse to the map and open your terminal (powershell, git bash, cmd), next install the dependecies

```
npm install
```

Now you can start the server by entering the following command in your terminal
```
npm start
```

Visit the application in the browser on 

```
localhost:3000
```

### License
MIT © Rob van der Pas
