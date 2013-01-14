var chart;
chart = {};
(function() {
  var HEIGHT, WIDTH;
  /**
   * @type {number}
   * @const
   */
  HEIGHT = 40;
  /**
   * @type {number}
   * @const
   */
  WIDTH = 200;
  /**
   * @param {Element} node
   * @param {Array.<Object>} data
   */
  function drawLine(node, data) {
    var line, x, y, svg;
    line = d3.svg.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.count); });
    _.each(data, function(d) {
      d.date = new Date(d.when);
    });
    x = d3.time.scale()
      .range([0, WIDTH])
      .domain(d3.extent(data, function(d) { return d.date; }));
    y = d3.scale.linear()
      .range([HEIGHT, 0])
      .domain(d3.extent(data, function(d) { return d.count; }));
    svg = d3.select(node);
    svg.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('d', line);
  }
  chart.drawLine = drawLine;
}());
