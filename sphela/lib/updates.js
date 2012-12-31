(function() {
  if(Meteor.isClient) {
    Template.updates.updates = function() {
      var updates;
      updates = Updates.find({}, {sort: {when: -1}});
      return updates || [];
    };
    Meteor.subscribe('recent-updates');
  }
})();
