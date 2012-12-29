if (Meteor.isClient) {
  Template.territoryCount.count = function() {
    var player;
    player = Players.findOne({userid: Meteor.userId()});
    return player.regions.length;
  }
  Template.floatingTroopCount.count = function() {
    var player;
    player = Players.findOne({userid: Meteor.userId()});
    return player.floatingTroops;
  }
}
