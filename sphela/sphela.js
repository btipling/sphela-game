if (Meteor.isClient) {
  $(window).ready(function() {
    var circle,
      projection,
      path,
      feature,
      arc,
      currentOrigin,
      transitionCoordinates,
      TRANSITION_DELAY,
      SCALE,
      ORIGIN,
      TRANSLATE,
      PRECISION,
      COLORS,
      dataStore;

    /**
     * @type {Array.<string>}
     * @const
     */
    COLORS = [
      '#ef8627',
      '#ff983d',
      '#f4a885',
      '#ff8f65',
      '#e7ac2e',
      '#f54e36',
      '#e28767',
      '#f89685',
      '#e2cc5f',
      '#faca6f',
      '#f7d454',
      '#ff7a2f',
      '#d0835c',
      '#ffa586',
      '#ff8e2c',
      '#e2c073',
      '#f7b52f',
      '#ffdc6a'
    ];

    /**
     * @type {Object}
     */
    dataStore = null;

    /**
     * @type {number}
     * @const
     */
    PRECISION = 2;

    /**
     * @type {number}
     * @const
     */
    SCALE = 200;

    /**
     * @type {Array}
     * @const
     */
    ORIGIN = [0, 0];

    /**
     * @type {Array}
     * @const
     */
    TRANSLATE = [200, 200];

    /**
     * @type {number}
     * @const
     */
    TRANSITION_DELAY = 5;

    /**
     * @type {number}
     */
    currentOrigin = ORIGIN;

    /**
     * @type {Object}
     */
    projection = d3.geo.azimuthal()
      .scale(SCALE)
      .origin(ORIGIN)
      .mode('orthographic')
      .translate(TRANSLATE);

    /**
     * @type {Object}
     */
    circle = d3.geo.greatCircle()
      .origin(projection.origin());

    /**
     * @type {Object}
     */
    path = d3.geo.path()
      .projection(projection);
    d3.json('/data/countries.geo.json', handleData);

    /**
     * @type {Object}
     */
    arc =  d3.geo.greatArc().precision(PRECISION);

    /**
     * @param {Object} data
     */
    function handleData(data) {
      dataStore = data;
      draw(data);
    }

    /**
     * @param {Object} data The geojson data.
     */
    function draw (data) {
      var svg;
      svg = d3.select('#map');
      svg.append('svg:circle')
        .attr('cx', SCALE)
        .attr('cy', SCALE)
        .attr('r', SCALE)
      svg.selectAll('path')
        .data(data.features)
        .enter().append('svg:path')
        .style('fill', function(d, i) { return COLORS[i%COLORS.length] })
        .attr('id', function(d) { return d.id })
        .attr('d', clip);
      feature = d3.selectAll('path');
    }

    /**
     * @param {Object} data
     * @return {Object}
     */
    function clip(data) {
      return path(circle.clip(data));
    }

    /**
     * @param {Array} coordinates
     */
    function reCenterMap(coordinates) {
      var beginning,
        end,
        arcResult;
      beginning = currentOrigin;
      end = coordinates;
      arcResult = arc({source: beginning, target: end});
      transitionCoordinates = transitionCoordinates || [];
      transitionCoordinates = transitionCoordinates.concat(arcResult.coordinates);
      moveToCenter();
    }

    /**
     * Recursively calls itself until coordinates are gone.
     */
    function moveToCenter() {
      var coords;
      if (_.isEmpty(transitionCoordinates)) {
        return;
      }
      coords = transitionCoordinates.shift();
      projection.origin(coords);
      circle.origin(coords);
      currentOrigin = coords;
      d3.timer.flush();
      feature.attr('d', clip);
      _.delay(_.bind(moveToCenter, this), TRANSITION_DELAY);
    }

    /**
     * @param {Object} event
     */
    function pathHandler(event) {
      var id, data, pixel, coords;
      d3.select(event.target).classed('clicked', true);
      id = event.target.id;
      data = _.where(dataStore.features, {id: id});
      pixel = path.centroid(_.first(data).geometry);
      coords = projection.invert(pixel);
      reCenterMap(coords);
    }

    Template.app.events({
      'click path': pathHandler
    });
  });
}

if (Meteor.isServer) {
  Meteor.startup(function() {
  });
}
