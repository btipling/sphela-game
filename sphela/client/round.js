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
  _.each(dataStore.features, function(region) {
    _.defer(_.bind(function(i) {
      $('#' + region.id).css('fill', global.COLORS[i%global.COLORS.length]);
    }, null, i));
    i += 1;
  });
}
