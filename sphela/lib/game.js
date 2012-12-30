/**
 * @fileOverview Runs the game information UI.
 */
(function() {
  if (Meteor.isClient) {
    var nextTick;

    /**
     * Tracks the number of seconds until next tick;
     * @type {number}
     */
    nextTick = 0;

    /**
     * Autoupdates seconds until next tick.
     */
    function updateSecondsUntilTick() {
      var seconds;
      _.delay(updateSecondsUntilTick, 1000);
      nextTick -= 1;
      if (nextTick < 0) {
        seconds = '0s*';
      } else {
        seconds = nextTick.toString(10) + 's';
      }
      $('.tick-updates').text(seconds);
    }
    updateSecondsUntilTick();

    Template.gameViews.loggedIn = function() {
      if (Session.get(sessionKeys.CONNECTED)) {
        return !!Meteor.user();
      }
      return false;
    };
    Template.gameInfo.round = function() {
      var game;
      game = Games.findOne();
      nextTick = global.TICK_INTERVAL/1000;
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
      return (game ? game.tick : 0).toString() + '/' + global.TICKS_IN_GAME;
    };
    Meteor.subscribe('tick');
    Meteor.subscribe('round');
  }
})();
