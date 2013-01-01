(function() {
  if (Meteor.isClient) {

    Template.territoryCount.count = function() {
      return playerRegions(Meteor.userId(), clientCurrentRoundNumber()).length;
    }

    /**
     * @return {number}
     */
    function getFloatingTroopsCount() {
      return playerFloatingTroops(Meteor.userId(), clientCurrentRoundNumber());
    }

    /**
     * @return {number}
     */
    Template.floatingTroopCount.count = function() {
      return getFloatingTroopsCount();
    };

    /**
     * @return {boolean}
     */
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

    /**
     * @return {boolean}
     */
    Template.playerStatus.hasTerritory = function() {
      var playerRound, userId, game, regions;
      userId = Meteor.userId();
      if (!userId) {
        return false;
      }
      game = Games.findOne();
      if (!game) {
        return false;
      }
      playerRound = PlayerRounds.findOne({userId: userId, round: game.currentRound});
      if (!playerRound) {
        return false;
      }
      regions = _.last(playerRound.regions);
      if (!regions) {
        return false;
      }
      return !!regions.length;
    };


    /**
     * @return {number}
     */
    Template.playerStatus.round = function() {
      var round;
      round = Rounds.findOne({round: clientCurrentRoundNumber()});
      return round ? round.round : 0;
    }
    Template.playerStatus.events({
      'click .join-round': joinRound
    });

    /**
     * @return {boolean}
     */
    Template.dropWarScreen.hasTroops = function() {
      return getFloatingTroopsCount() > 0;
    };

    /**
     * @return {boolean}
     */
    Template.dropWarScreen.hasSelection = function() {
      return !!Session.get('selectedRegion');
    };

    /**
     * @param {Object} event
     */
    function handleDropAttack(event) {
      var region, userId;
      console.log('dropping attack on', Session.get('selectedRegion'));
      region = Session.get('selectedRegion');
      userId = Meteor.userId();
      if (userId && region) {
        Meteor.call('dropAttack', userId, region.id, global.NOOP);
      }
    }

    Template.dropWarScreen.events({
      'click .drop-attack': handleDropAttack
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
