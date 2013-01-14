/**
 * @fileOverview Runs the game information UI.
 */
var global = this;
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
      var round;
      nextTick = global.TICK_INTERVAL/1000;
      round = clientCurrentRoundNumber();
      Session.set('currentRound', round);
      return round;
    };
    Template.gameInfo.playerCount = function() {
      var round;
      round = Rounds.findOne({round: clientCurrentRoundNumber()});
      global.clearClientRound();
      return round ? _.last(round.numPlayers).count : 0;
    };
    Template.gameInfo.tick = function() {
      var game;
      game = Games.findOne();
      return (game ? game.tick : 0).toString() + '/' + global.TICKS_IN_GAME;
    };

    Template.topStats.topStats = function() {
      return {topRegions: 'works'};
    };

    /**
     * @return {Array}
     */
    Template.topStats.topPlayerRegions = function() {
      var topStats, topPlayerRegions, res;
      topStats = TopStats.findOne({round: clientCurrentRoundNumber()});
      if (!topStats) {
        return [];
      }
      return topStats.topPlayerRegions || [];
    };

    /**
     * @return {Array}
     */
    Template.topStats.topPlayerTroops = function() {
      var topStats, topPlayerRegions, res;
      topStats = TopStats.findOne({round: clientCurrentRoundNumber()});
      if (!topStats) {
        return [];
      }
      return topStats.topPlayerTroops || [];
    };

    /**
     * @return {Array}
     */
    Template.topStats.topPlayerCredits = function() {
      var topStats, topPlayerRegions, res;
      topStats = TopStats.findOne({round: clientCurrentRoundNumber()});
      if (!topStats) {
        return [];
      }
      return topStats.topPlayerCredits || [];
    };

    /**
     * @return {Array}
     */
    Template.topStats.topRegionTroops = function() {
      var topStats, topPlayerRegions, res;
      topStats = TopStats.findOne({round: clientCurrentRoundNumber()});
      if (!topStats) {
        return [];
      }
      return topStats.topRegionTroops || [];
    };



    Meteor.subscribe('tick');
    Meteor.subscribe('round');
    Meteor.subscribe('topstats');
  }
})();
