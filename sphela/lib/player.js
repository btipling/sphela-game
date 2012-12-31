(function() {
  if (Meteor.isClient) {

    Template.territoryCount.count = function() {
      return playerRegions(Meteor.userId(), clientCurrentRoundNumber());
    }

    Template.floatingTroopCount.count = function() {
      return playerFloatingTroops(Meteor.userId(), clientCurrentRoundNumber());
    };

    Template.playerStatus.isPlaying = function() {
      var game, player, userId;
      game = Games.findOne();
      userId = Meteor.userId();
      if (!game || !userId) {
        return false;
      }
      player = Players.findOne({userId: userId});
      if (!player) {
        return false;
      }
      return _.indexOf(player.rounds, game.currentRound) !== -1;
    };

    Template.playerStatus.round = function() {
      var round;
      round = Rounds.findOne({round: clientCurrentRoundNumber()});
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
      console.log('joinRound');
      userId = Meteor.userId();
      if (userId) {
        Meteor.call('joinRound', userId, global.NOOP);
      }
    }
    Meteor.autosubscribe(function() {
      Meteor.subscribe('player', Meteor.userId());
    });
    Meteor.autosubscribe(function() {
      Meteor.subscribe('player-round-updates', Meteor.userId(),
        Session.get('currentRound'));
    });
  }
})();
