if (Meteor.isClient) {
  $(window).ready(function() {
    var circle,
      projection,
      projectionBg,
      path,
      feature,
      arc,
      currentOrigin,
      currentRegion,
      currentScale,
      transitionScale,
      transitionCoordinates,
      TRANSITION_DELAY,
      SELECTED_REGION,
      SCALE,
      ORIGIN,
      PRECISION,
      COLORS,
      dataStore;

    /**
     * Key for setting region in session.
     * @type {string}
     * @const
     */
    SELECTED_REGION = 'selectedRegion';

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
    PRECISION = 3;

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
     * @type {Object}
     */
    currentRegion = null;

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
    $(window).on('popstate', function() {
      var id, data;
      id = window.location.pathname.substr(1);
      console.log('popstate', id);
      data = _.where(dataStore.features, {id: id});
      selectRegion(data);
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
      findLeftOver();
      draw(data);
    }

    function findLeftOver() {
      Session.set('leftOverRegions', _.map(dataStore.features,
        function(item) {
        return {
          name: item.properties.name,
          id: item.id
        };
      }));
    }

    /**
     * @param {Object} data The geojson data.
     */
    function draw (data) {
      var svg;
      svg = d3.select('#map');
      projectionBg = svg.append('svg:circle');
      projectionBg.attr('cx', currentScale)
        .classed('oceanBG', true)
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
      leftSet =  width/2;
      topSet =   height/2;
      projection.translate([leftSet, topSet]);
      console.log('projectionBg', projectionBg);
      if (projectionBg) {
        projectionBg.attr('transform',
            [
              'translate(',
              leftSet-SCALE,
              ', ',
              topSet-SCALE,
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
      if (coordinates === currentOrigin) {
        return;
      }
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
        // Checking to make sure we actually made it. This is a noop of
        // we are actually there.
        selectRegion(currentRegion);
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
      var id, data, name;
      id = event.target.id;
      data = _.where(dataStore.features, {id: id});
      name = _.first(data).properties.name;
      history.pushState({data: data}, name, id);
      selectRegion(data);
    }

    /**
     * @param {Array<Object>} regions;
     */
    function selectRegion(regions) {
      var region, pixel, coords, target, parent;
      stopZoom();
      currentRegion = regions;
      region = _.first(regions);
      target = $('#' + region.id).get(0);
      d3.selectAll('.clicked').classed('clicked', false);
      d3.select(target).classed('clicked', true);
      // Putting on top of stack.
      parent = target.parentNode;
      parent.removeChild(target);
      parent.appendChild(target);
      Session.set(SELECTED_REGION, region);
      pixel = path.centroid(region.geometry);
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
      animateZoom(oldScale);
    }

    /**
     * @pram {Object} event
     */
    function handleZoomOut(event) {
      currentScale /= 1.4;
      animateZoom();
    }

    function animateZoom() {
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
      requestAnimationFrame(_.bind(animateZoom, this));
    }

    /**
     * @param {Object} event
     */
    function handleRegionClick(event) {
      var id, name;
      console.log('wtf');
      event.preventDefault();
      id = d3.select(event.target).attr('data-id');
      data = _.where(dataStore.features, {id: id});
      name = _.first(data).properties.name;
      d3.selectAll('.clicked').classed('clicked', false);
      d3.select('#' + id).classed('clicked', true);
      history.pushState({data: data}, name, id);
      selectRegion(data);
    }

    Template.app.events({
      'click path': handlePath,
      'click .zoom-in': handleZoomIn,
      'click .zoom-out': handleZoomOut,
      'click .left-over-region': handleRegionClick
    });

    Template.region.regionName = function() {
      var region;
      region = Session.get(SELECTED_REGION);
      return region ? region.properties.name : 'Select a region.';
    };

    Template.leftOver.leftOverRegions = function(regions) {
      return Session.get('leftOverRegions');;
    };
  });
}

if (Meteor.isServer) {
  Meteor.startup(function() {
  });
}
