var global;
global = this;
/**
 * @fileOverview Client side round functions.
 */
function clearClientRound() {
  var index;
  i = 0;
  if (!dataStore) {
    console.log('no datastore');
    return;
  }
  _.defer(function() {
    var round, regions;
    round = Rounds.findOne({round: clientCurrentRoundNumber()});
    if (!round) {
      regions = null;
    } else {
      regions = round.regions;
    }
    _.each(dataStore.features, function(region, index) {
      var userId;
      try {
        path = d3.select('#' + region.id);
      } catch(e) {
        return;
      }
      if (path) {
        if (regions && _.has(regions, region.id)) {
          userId = _.last(regions[region.id].owner).userId;
          if (userId && _.has(round.playerInfo, userId)) {
            path.style('fill', round.playerInfo[userId].color);
            return;
          }
        }
        path.style('fill',
          global.COLORS[index%global.COLORS.length]);
      }
    });
  });
}
global.clearClientRound = clearClientRound;
