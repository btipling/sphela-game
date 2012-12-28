
if (Meteor.isClient) {
  $(window).ready(function() {
    /**
     * @type {Object}
     */
    var regionStore;
    try {
      regionStore = JSON.parse(localStorage.getItem('regionStore'));
      if (_.isNull(regionStore)) {
        regionStore = {};
      }
    } catch (e) {
      console.log('no store');
      regionStore = {};
    }
    saveStore();

    function saveStore() {
      localStorage.setItem('regionStore', JSON.stringify(regionStore));
    }

    Template.configmaker.selectedRegion = function() {
      var region;
      region = Session.get(sessionKeys.SELECTED_REGION);
      return region ? region.properties.name : 'Select a region.';
    };
    /**
     * @param {Object} event
     */
    function setRegion(event) {
      Session.set(sessionKeys.SET_REGION,
        Session.get(sessionKeys.SELECTED_REGION));
    }
    /**
     * @param {Object} event
     */
    function handleRemoveRegion(event) {
      handleRegionEvent(event, removeRegion);
    }
    /**
     * @param {Object} event
     */
    function handleAddRegion(event) {
      handleRegionEvent(event, addRegion);
    }
    /**
     * @param {Object} event
     * @param {Function} func
     */
    function handleRegionEvent(event, func) {
      var regionSet, setRegion, regionObj, selectedRegion;;
      setRegion = Session.get(sessionKeys.SET_REGION);
      if (!setRegion) {
        return;
      }
      selectedRegion = Session.get(sessionKeys.SELECTED_REGION);
      if (!selectedRegion) {
        console.log('No region selected.');
        return;
      }
      func(selectedRegion.id, setRegion.id);
      func(setRegion.id, selectedRegion.id);
    }
    function updateTemplates() {
      _.defer(function() {
        var data, regionsWithNoSets, allRegions;
        data = localStorage.getItem('regionStore');
        $('.regionSetJSON').html(data);
        $('#regionsWithNoSets').html(Meteor.render(function() {
          var allRegions, map;
          map = {};
          allRegions = Session.get(sessionKeys.ALL_REGIONS);
          if (allRegions) {
            regionsWithNoSets = _.map(
              _.filter(allRegions, function(region) {
                map[region.id] = region;
                return !_.has(regionStore, region.id);
              }), function(region) {
                return map[region.id];
            });
          }
          return Template.regionsWithNoSets(regionsWithNoSets);
        }));
      });
    }

    function removeRegion(regionId, vectorId) {
      var region;
      if (!_.has(regionStore, regionId)) {
        return;
      }
      region = regionStore[regionId];
      region.vectors = _.without(region.vectors, vectorId);
      saveStore();
    }

    /**
     * @param {string} regionId
     * @param {string} vectorId
     */
    function addRegion(regionId, vectorId) {
      if (regionId === vectorId) {
        return;
      }
      if (!_.has(regionStore, regionId)) {
        regionStore[regionId] = {};
      }
      regionObj = regionStore[regionId];
      if (!_.has(regionObj, 'vectors')) {
        regionObj.vectors = [];
      }
      regionObj.vectors.push(vectorId);
      regionObj.vectors = _.uniq(regionObj.vectors);
      saveStore();
    }
    Template.configmaker.events({
      'click #set-region': setRegion,
      'click #add-region': handleAddRegion,
      'click #remove-region': handleRemoveRegion
    });
    Template.configmaker.setRegion = function() {
      var region;
      region = Session.get(sessionKeys.SET_REGION);
      updateTemplates();
      return region ? region.properties.name : 'Set a region.';
    };
    Template.configmaker.regionsInSet = function() {
      var region, allRegions;
      region = Session.get(sessionKeys.SET_REGION);
      allRegions = Session.get(sessionKeys.ALL_REGIONS);
      if (!allRegions || !region || !_.has(regionStore, region.id)) {
        return [];
      }
      updateTemplates();
      return _.map(regionStore[region.id].vectors, function(currentRegion) {
        return _.find(allRegions, function(item) {
          return item.id === currentRegion;
        });
      });
    };
  });
}
