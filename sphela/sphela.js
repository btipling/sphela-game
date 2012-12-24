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
      dataStore;

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
    TRANSLATE = [250, 250];

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
      d3.select('#map').selectAll('path')
        .data(data.features)
        .enter().append('svg:path')
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
