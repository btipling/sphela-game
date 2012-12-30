(function() {
  if(Meteor.isClient) {
    Template.updates.updates = function() {
      var updates;
      updates = Updates.find({}, {sort: {when: -1}});
      console.log('updates', updates);
      return updates || [];
    };
    Meteor.subscribe('recent-updates');
    Meteor.autosubscribe(function() {
      var game;
      game = Games.findOne();
      Meteor.subscribe('round-updates', game ? game.currentRegion : 0);
    });
  }
})();
