/**
 * @fileOverview This draws the main game area and starts the front-end.
 */
var global = this;

/**
 * @type {number}
 * @const
 */
global.TICK_INTERVAL = 30000;

/**
 * @type {number}
 * @const
 */
global.TICKS_IN_GAME = 720;

/**
 * The troop count in an empty region.
 * @type {number}
 * @const
 */
global.EMPTY_REGION_TROOPS = 3;

/**
 * @type {Array.<string>}
 * @const
 */
global.COLORS = [
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

if (Meteor.isClient) {
  Session.set(sessionKeys.CONNECTED, false);
  $(function() {
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
      COORD_PRECISION,
      SCALE,
      ORIGIN,
      PRECISION;

    /**
     * @type {number}
     * @const
     */
    PRECISION = 3;

    /**
     * @type {number}
     * @const
     */
    COORD_PRECISION = 0.0001;

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

    $(window).on('resize', function () {
      transitionCoordinates = [projection.origin()];
      centerMap();
      moveToCenter();
    });
    $(window).on('popstate', function() {
      var id, data;
      id = window.location.pathname.substr(1);
      if (!dataStore) {
        console.log('No dataStore, popState');
        return;
      }
      data = _.where(dataStore.features, {id: id});
      waitForId(data);
    });

    /**
     * @param {string} id
     * @return {Object} The path element.
     */
    function getTarget(id) {
      return $('#' + id).get(0);
    }

    /**
     * @param {Object} data
     */
    function waitForId(data) {
      if (!data || _.isEmpty(data)) {
        return;
      }
      if (!getTarget(_.first(data).id)) {
        _.defer(function() {
          waitForId(data);
        });
      } else {
        selectRegion(data);
      }
    }

    /**
     * @param {string} id
     * @return {Array.<string>}
     */
    function getVectors(id) {
      if (_.has(regionStore, id)) {
        return regionStore[id].vectors;
      }
      return [];
    }

    /**
     * @type {Object}
     */
    arc =  d3.geo.greatArc().precision(PRECISION);

    function findLeftOver() {
      if (!dataStore) {
        console.log('No datastore, findLeftOver');
        return;
      }
      Session.set(sessionKeys.ALL_REGIONS, _.map(dataStore.features,
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
        .style('fill', function(d, i) {
            return global.COLORS[i%global.COLORS.length]
          })
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
      console.log('in clip');
      return path(circle.clip(data));
    }

    /**
     * @param {Array} coordinates
     */
    function reCenterMap(coordinates) {
      var beginning,
        end,
        arcResult,
        lat_diff,
        lon_diff;
      lat_diff = Math.abs(_.first(coordinates) - _.first(currentOrigin));
      lon_diff = Math.abs(_.last(coordinates) - _.last(currentOrigin));
      if (lat_diff <= COORD_PRECISION && lon_diff <= COORD_PRECISION) {
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
        /*
         * Checking to make sure we actually made it. This is a noop if
         * we are actually there.
         */
        selectRegion(currentRegion);
        return;
      }
      if (!feature) {
        // No data yet.
        return;
      }
      coords = transitionCoordinates.shift();
      projection.origin(coords);
      circle.origin(coords);
      currentOrigin = coords;
      console.log('feature', feature);
      feature.attr('d', clip);
      _.delay(_.bind(moveToCenter, this), TRANSITION_DELAY);
    }

    /**
     * @param {Object} event
     */
    function handlePath(event) {
      var id, data, name;
      id = event.target.id;
      if (!dataStore) {
        console.log('No datastore, handlePath');
        return;
      }
      data = _.where(dataStore.features, {id: id});
      name = _.first(data).properties.name;
      history.pushState({data: data}, name, id);
      selectRegion(data);
    }

    /**
     * @param {Object} event
     */
    function handleOverPath(event) {
      var id, data;
      id = event.target.id;
      if (!dataStore) {
        console.log('No dataStore handleOverPath');
        return;
      }
      data = _.where(dataStore.features, {id: id});
      Session.set('requestedRegion', _.first(data));
    }

    /**
     * @param {Array<Object>} regions;
     */
    function selectRegion(regions) {
      var region, pixel, coords, target, parent;
      stopZoom();
      // currentRegion is a shared variable.
      currentRegion = regions;
      region = _.first(regions);
      target = getTarget(region.id);
      d3.selectAll('.clicked').classed('clicked', false);
      d3.select(target).classed('clicked', true);
      Session.set('selectedRegion', region);
      Session.set('requestedRegion', region);
      highlightVectors(region.id);
      toTop(region.id);
      pixel = path.centroid(region.geometry);
      coords = projection.invert(pixel);
      reCenterMap(coords);
    }

    /**
     * Put all the vectors and region on top of the dom stack so their strokes
     * show clearly.
     * @param {string} region
     */
    function toTop(region) {
      var target;
      target = getTarget(region);
      if (target) {
        parent = target.parentNode;
        parent.removeChild(target);
        parent.appendChild(target);
      }
    }

    /**
     * @param {string} region
     */
    function highlightVectors(region) {
      var vectors;
      Session.set('selectedTarget', null);
      d3.selectAll('.vector').classed('vector', false);
      d3.selectAll('.targeted').classed('targeted', false);
      vectors = getVectors(region);
      _.each(vectors, function(id) {
        d3.select('#' + id).classed('vector', true);
      });
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
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(_.bind(animateZoom, this));
      } else {
        _.delay(_.bind(animateZoom, this), 0);
      }
    }

    /**
     * @param {Object} event
     */
    function handleRegionClick(event) {
      var id, name;
      event.preventDefault();
      id = d3.select(event.target).attr('data-id');
      if (!dataStore) {
        console.log('No datastore handleRegionClick');
        return;
      }
      data = _.where(dataStore.features, {id: id});
      name = _.first(data).properties.name;
      d3.selectAll('.clicked').classed('clicked', false);
      d3.select('#' + id).classed('clicked', true);
      history.pushState({data: data}, name, id);
      selectRegion(data);
    }

    /**
     * @param {Object} event
     */
    function handleSubmitChat(event) {
      event.preventDefault();
      var message, userId, input;
      input = $('.chat-update');
      message = $.trim(input.val());
      message = message.substr(0, MAX_MESSAGE_LENGTH);
      input.val('');
      userId = Meteor.userId();
      if (userId) {
        Meteor.call('say', message, global.NOOP);
      }
    }

    Template.app.events({
      'click path': handlePath,
      'mouseenter path': handleOverPath,
      'click .zoom-in': handleZoomIn,
      'click .zoom-out': handleZoomOut,
      'click .left-over-region': handleRegionClick,
    });

    Template.chatInput.events({
      'submit .update-chatbox': handleSubmitChat
    });

    /**
     * The name of the selected region.
     * @return {string}
     */
    Template.region.regionName = function() {
      var region;
      region = Session.get('requestedRegion');
      return region ? region.properties.name : 'Select a region.';
    };

    /**
     * The ruler of the selected region.
     * @return {string}
     */
    Template.region.owner = function() {
      var round, region, userId;
      region = Session.get('requestedRegion');
      round = Rounds.findOne({round: clientCurrentRoundNumber()});
      if (!round || !region) {
        return 'None';
      }
      if (!_.has(round.regions, region.id)) {
        return 'None';
      }
      userId = _.last(round.regions[region.id].owner).userId;
      if (!userId) {
        return 'None';
      }
      return round.playerInfo[userId].name;
    };

    /**
     * The number of troops on the selected region.
     * @return {string}
     */
    Template.region.troops = function() {
      var round, region, troopCount;
      region = Session.get('requestedRegion');
      round = Rounds.findOne({round: clientCurrentRoundNumber()});
      if (!round || !region) {
        return global.EMPTY_REGION_TROOPS.toString();
      }
      if (!_.has(round.regions, region.id)) {
        return global.EMPTY_REGION_TROOPS.toString();
      }
      troopCount = round.regions[region.id].troopCount;
      if (_.isEmpty(troopCount)) {
        return global.EMPTY_REGION_TROOPS.toString();
      } else {
        return _.last(troopCount).count.toString();
      }
    };

    Template.leftOver.leftOverRegions = function(regions) {
      return Session.get(sessionKeys.ALL_REGIONS);;
    };
    /**
     * @param {Object} data
     */
    function main() {
      _.defer(function() {
        findLeftOver();
        draw(dataStore);
        Session.set(sessionKeys.CONNECTED, true);
      });
    }
    _.defer(function() {
      main();
    });
    Meteor.autorun(function() {
      Meteor.call('loginGame', Meteor.userId());
    });
  });
}
