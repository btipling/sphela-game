(function() {
  if (Meteor.isClient) {
    Template.gameViews.loggedIn = function() {
      if (Session.get(sessionKeys.CONNECTED)) {
        return !!Meteor.user();
      }
      return false;
    };
    Template.gameInfo.round = function() {
      var game;
      game = Games.findOne();
      return game ? game.currentRound : 0;
    };
    Template.gameInfo.playerCount = function() {
      var game, round;
      game = Games.findOne();
      if (!game) {
        return 0;
      }
      round = Rounds.findOne({round: game.currentRound});
      return round ? round.numPlayers : 0;
    };
    Template.gameInfo.tick = function() {
      var game;
      game = Games.findOne();
      return game ? game.tick : 0;
    };
    Meteor.subscribe('tick');
    Meteor.subscribe('round');
  }
})();
