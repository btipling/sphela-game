if (Meteor.isClient) {
  $(window).ready(function() {
    var circle,
      projection,
      projectionBg,
      path,
      feature,
      arc,
      currentOrigin,
      currentScale,
      transitionScale,
      transitionCoordinates,
      TRANSITION_DELAY,
      SCALE,
      ORIGIN,
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
     * @type {number}
     * @const
     */
    TRANSITION_DELAY = 5;

    /**
     * @type {number}
     */
    currentOrigin = ORIGIN;

    /**
     * @type {number}
     */
    currentScale = SCALE;

    /**
     * @type {number}
     */
    transitionScale = SCALE;

    /**
     * @type {Object}
     */
    projection = d3.geo.azimuthal()
      .scale(currentScale)
      .origin(ORIGIN)
      .mode('orthographic');
    centerMap();

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
    $(window).on('resize', function () {
      transitionCoordinates = [projection.origin()];
      centerMap();
      moveToCenter();
    });

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
      projectionBg = svg.append('svg:circle');
      projectionBg.attr('cx', currentScale)
        .attr('cy', currentScale)
        .attr('r', currentScale)
        .style('fill', 'url(#ocean)')
        .style('filter', 'url(#atmosphere)');
      svg.selectAll('path')
        .data(data.features)
        .enter().append('svg:path')
        .style('fill', function(d, i) { return COLORS[i%COLORS.length] })
        .attr('id', function(d) { return d.id })
        .attr('d', clip);
      centerMap();
      feature = d3.selectAll('path');
    }

    function centerMap() {
      var width, height, mapWidth, mapHeight, leftSet, topSet;
      width = $(window).width();
      height = $(window).height();
      mapWidth = currentScale
      mapHeight = currentScale;
      leftSet =  width/2;
      topSet =   height/2;
      projection.translate([leftSet, topSet]);
      if (projectionBg) {
        projectionBg.attr('transform',
            [
              'translate(',
              leftSet-mapWidth,
              ', ',
              topSet-mapHeight,
              ')'
            ].join(''));
       }
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
      feature.attr('d', clip);
      _.delay(_.bind(moveToCenter, this), TRANSITION_DELAY);
    }

    /**
     * @param {Object} event
     */
    function handlePath(event) {
      var id, data, pixel, coords;
      stopZoom();
      d3.selectAll('.clicked').classed('clicked', false);
      d3.select(event.target).classed('clicked', true);
      id = event.target.id;
      data = _.where(dataStore.features, {id: id});
      pixel = path.centroid(_.first(data).geometry);
      coords = projection.invert(pixel);
      reCenterMap(coords);
    }

    function stopZoom() {
      currentScale = transitionScale;
    }

    /**
     * @param {Object} event
     */
    function handleZoomIn(event) {
      var oldScale;
      oldScale = currentScale;
      currentScale *= 1.4;
      zoomAnimate(oldScale);
    }

    /**
     * @pram {Object} event
     */
    function handleZoomOut(event) {
      currentScale /= 1.4;
      zoomAnimate();
    }

    function zoomAnimate() {
      var change, max;
      change = 20;
      max = 400;
      if (Math.abs(transitionScale - currentScale) < change) {
        return;
      }
      if (transitionScale < currentScale) {
        if (currentScale >= max) {
          transitionScale = currentScale;
        } else {
          transitionScale += (currentScale-transitionScale)/change;
        }
      } else {
        if (transitionScale >= max) {
          transitionScale = currentScale;
        } else {
          transitionScale -= (transitionScale-currentScale)/change;
        }
      }
      projection.scale(transitionScale);
      feature.attr('d', clip);
      projectionBg.attr('r', transitionScale);
      requestAnimationFrame(_.bind(zoomAnimate, this));
    }

    Template.app.events({
      'click path': handlePath,
      'click .zoom-in': handleZoomIn,
      'click .zoom-out': handleZoomOut
    });
  });
}

if (Meteor.isServer) {
  Meteor.startup(function() {
  });
}
