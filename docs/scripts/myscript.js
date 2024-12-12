// add your JavaScript/D3 to this file
// Set up dimensions
const margin = {top: 50, right: 30, bottom: 70, left: 60};
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Data processing function
function processData(data, year) {
    const yearData = data.filter(d => d.year === year);
    const counts = {
        "Low": yearData.filter(d => !isNaN(d.gini) && d.gini < 30).length,
        "Mid": yearData.filter(d => !isNaN(d.gini) && d.gini >= 30 && d.gini <= 40).length,
        "High": yearData.filter(d => !isNaN(d.gini) && d.gini > 40).length
    };
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts).map(([key, value]) => ({
        category: key,
        count: value,
        percentage: total > 0 ? (value / total * 100).toFixed(1) : 0
    }));
}

d3.json("gini_data.json")
  .then(function(rawData) {
    console.log("Data loaded successfully:", rawData);
    // Continue with your processing...
  })
  .catch(function(error) {
    console.error("Error loading JSON file:", error);
  });
  

// Load your data
d3.json("gini_data.json").then(function(rawData) {
    // Get unique years
    const years = [...new Set(rawData.map(d => d.year))].sort();

    // Calculate maximum count across all years
    const maxCount = d3.max(years.map(year => {
        const data = processData(rawData, year);
        return d3.max(data, d => d.count);
    }));

    // Set up scales
    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, maxCount]);  // Set fixed domain based on max count

    // Color scale
    const color = d3.scaleOrdinal()
        .domain(["Low", "Mid", "High"])
        .range(["#fecc5c", "#fd8d3c", "#e31a1c"]);

    // Add axes
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height})`);

    const yAxis = svg.append("g");

    // Add axis labels
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width/2)
        .attr("y", height + 40)
        .text("Gini Level");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -40)
        .attr("x", -height/2)
        .text("Number of Countries");

    // Add title
    const title = svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width/2)
        .attr("y", -20)
        .attr("class", "title")
        .style("font-size", "16px");

    // Create slider
    const slider = d3.select("#plot")
        .append("div")
        .style("margin-top", "20px")
        .append("input")
        .attr("type", "range")
        .attr("min", d3.min(years))
        .attr("max", d3.max(years))
        .attr("value", d3.min(years))
        .attr("step", 1);

    // Add year label
    const yearLabel = d3.select("#plot")
        .append("div")
        .attr("class", "slider-label")
        .style("margin-top", "5px");

    // Update function
    function update(year) {
        const data = processData(rawData, year);
        
        // Update scales
        x.domain(data.map(d => d.category));
      

        // Update axes
        xAxis.call(d3.axisBottom(x));
        yAxis.call(d3.axisLeft(y));

        // Update bars
        const bars = svg.selectAll(".bar")
            .data(data);

        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .merge(bars)
            .transition()
            .duration(200)
            .attr("x", d => x(d.category))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.count))
            .attr("height", d => height - y(d.count))
            .attr("fill", d => color(d.category));

        // Update labels
        const labels = svg.selectAll(".bar-label")
            .data(data);

        labels.enter()
            .append("text")
            .attr("class", "bar-label")
            .merge(labels)
            .transition()
            .duration(200)
            .attr("x", d => x(d.category) + x.bandwidth()/2)
            .attr("y", d => y(d.count) - 5)
            .text(d => `${d.count}\n(${d.percentage}%)`);

        // Update title
        title.text(`Gini Level Distribution in ${year}`);
        yearLabel.text(`Year: ${year}`);
    }

    // Event listener for slider
    slider.on("input", function() {
        update(+this.value);
    });

    // Initial update
    update(+slider.property("value"));
});
