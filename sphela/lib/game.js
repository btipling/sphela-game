(function() {
  if (Meteor.isClient) {
    Template.gameViews.loggedIn = function() {
      if (Session.get(sessionKeys.CONNECTED)) {
        console.log('wtf connected', Session.get(sessionKeys.CONNECTED));
        return !!Meteor.user();
      }
      return false;
    };
  }
})();
