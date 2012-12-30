if (Meteor.isClient) {
  (function() {

    Template.territoryCount.count = function() {
      var player;
      player = Players.findOne({userId: Meteor.userId()});
      return player.regions.length;
    }

    Template.floatingTroopCount.count = function() {
      var player;
      player = Players.findOne({userId: Meteor.userId()});
      return player.floatingTroops;
    };

    Template.playerStatus.isPlaying = function() {
      var game, player, userId;
      game = Games.findOne();
      userId = Meteor.userId();
      if (!game || !userId) {
        return false;
      }
      player = Players.findOne({userId: userId});
      return player ? player.currentRound === game.currentRound : false;
    };

    Template.playerStatus.round = function() {
      var round, game;
      game = Games.findOne();
      if (!game) {
        return 0;
      }
      round = Rounds.findOne({round: game.currentRound});
      return round ? round.round : 0;
    }
    Template.playerStatus.events({
      'click .join-round': joinRound
    });
    /**
     * @param {Object} event
     */
    function joinRound(event) {
      var userId;
      userId = Meteor.userId();
      if (userId) {
        Meteor.call('joinRound', userId, global.NOOP);
      }
    }
  })();
  Meteor.autosubscribe(function() {
    Meteor.subscribe('player', Meteor.userId());
  });
}
