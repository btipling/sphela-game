(function() {
  if (Meteor.isClient) {
    var currentRoundSub;

    /**
     * @param {Object} event
     */
    function joinRound(event) {
      var userId;
      console.log('joining');
      userId = Meteor.userId();
      console.log('joining', userId);
      if (userId) {
        console.log('calling join round!');
        Meteor.call('joinRound', global.NOOP);
        _.defer(function() {
          Meteor.subscribe('join');
        });
      }
    }

    Template.playerCounts.regions = function() {
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
    Template.playerCounts.floatingTroops = function() {
      return getFloatingTroopsCount();
    };

    /**
     * @return {boolean}
     */
    Template.playerStatus.isPlaying = function() {
      var game, player, userId;
      console.log('is playering?');
      game = Games.findOne();
      userId = Meteor.userId();
      if (!game || !userId) {
        console.log('no game, no userid', game, userId);
        return false;
      }
      player = Players.findOne({userId: userId});
      if (!player) {
        console.log('no player', player);
        return false;
      }
      console.log('player.currentRound', player.currentRound, 'game.currentRound', game.currentRound);
      return player.currentRound === game.currentRound;
    };

    /**
     * @return {Object} Returns the player round or null.
     */
    function getPlayerRound() {
      var userId, game;
      userId = Meteor.userId();
      if (!userId) {
        return null;
      }
      game = Games.findOne();
      if (!game) {
        return null;
      }
      return PlayerRounds.findOne({userId: userId, round: game.currentRound});
    }

    /**
     * @return {boolean}
     */
    Template.playerStatus.hasTerritory = function() {
      var playerRound, regions;
      playerRound = getPlayerRound();
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
      console.log('template rounds', round, clientCurrentRoundNumber());
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
      region = Session.get('selectedRegion');
      userId = Meteor.userId();
      if (userId && region) {
        Meteor.call('dropAttack', region.id, global.NOOP);
      }
    }

    Template.dropWarScreen.events({
      'click .drop-attack': handleDropAttack
    });

    /**
     * @return {string}
     */
    Template.playerColor.color = function() {
      var playerRound;
      playerRound = getPlayerRound();
      if (!playerRound) {
        return '#FFF';
      }
      return playerRound.color;
    };

    /**
     * @return {Array.<Object>}
     */
    Template.playerMessages.messages = function() {
      var playerRound;
      playerRound = getPlayerRound();
      if (!playerRound) {
        return [];
      }
      return playerRound.messages;
    };

    /**
     * @param {string=} opt_region
     * @param {Object=} opt_playerRound
     * @param {Object=} opt_round
     * @return {boolean}
     */
    function canSelect(opt_region, opt_playerRound, opt_round) {
      var selectedRegion, playerRound, round, troopCount;
      if (_.isUndefined(opt_region)) {
        selectedRegion = Session.get('selectedRegion');
      } else {
        selectedRegion = opt_region;
      }
      if (!selectedRegion) {
        return false;
      }
      playerRound = opt_playerRound || getPlayerRound();
      if (!playerRound) {
        return false;
      }
      if (_.indexOf(playerRound.regions, selectedRegion.id) === -1) {
        return false;
      }
      round = opt_round || Rounds.findOne({round: clientCurrentRoundNumber()});
      if (!_.has(round.regions, selectedRegion.id)) {
        return false;
      }
      troopCount = round.regions[selectedRegion.id].troopCount;
      if (_.isEmpty(troopCount)) {
        return false;
      }
      return _.last(troopCount).count > 0;
    }
    Template.targetSelection.canSelect = function () {
      return canSelect();
    };

    /**
     * @return {Array.<Object>}
     */
    Template.targetSelection.targets = function() {
      var source, vectors, playerRound, selected;
      source = Session.get('selectedRegion');
      if (!source) {
        return [];
      }
      playerRound = getPlayerRound();
      if (!canSelect(source, playerRound)) {
        return [];
      }
      vectors = _.filter(regionStore[source.id].vectors, function(region) {
        return _.indexOf(playerRound.regions, region) === -1;
      });
      if (_.isEmpty(vectors)) {
        return [];
      }
      selected = Session.get('selectedTarget') || _.first(vectors);
      setSelectedTarget(selected);
      return _.map(vectors, function(vector) {
        return {
          selected: vector === selected,
          id: vector,
          name: regionStore[vector].name
        };
      });
    };

    /**
     * @return {Array.<Object>}
     */
    Template.sourceSelection.sources = function() {
      var playerRound, availableRegions, round;
      playerRound = getPlayerRound();
      if (!playerRound || _.isEmpty(playerRound.regions)) {
        return [];
      }
      round = Rounds.findOne({round: clientCurrentRoundNumber()});
      if (!round) {
        return [];
      }
      availableRegions = _.filter(playerRound.regions, function(region) {
        return canSelect({id: region}, playerRound, round);
      });
      return _.map(availableRegions, function(region) {
        return {
          selected: Session.get('selectedRegion') === region,
          name: regionStore[region].name,
          id: region
        };
      });
    }

    Template.targetSelection.events({
      'change .target-selector': handleTargetSelection
    });

    /**
     * @param {Object} event
     */
    function handleTargetSelection(event) {
      setSelectedTarget($(event.target).val());
    }

    /**
     * @param {string} region
     */
    function setSelectedTarget(region) {
      Session.set('selectedTarget', region);
      d3.select('.targeted').classed('targeted', false);
      d3.select('#' + region).classed('targeted', true);
    }
    Meteor.autorun(function() {
      console.log('Players updated!', Players.find());
    });

    Meteor.autosubscribe(function() {
      var game;
      game = Games.findOne();
      if (!game) {
        console.log('no fucking game');
        return;
      }
      console.log('autosubbing');
      if (currentRoundSub === game.currentRound) {
        console.log('already subbed wtf');
        return;
      }
      console.log('autosubscribe player', Meteor.userId(), game.currentRound);
      console.log('subscribing to this shiznits', Meteor.userId(), game.currentRound);
      currentRoundSub = game.currentRound;
      if (game) {
        Meteor.subscribe('player-game', game.currentRound);
      }
    });
    Meteor.autosubscribe(function() {
      if (typeof clearClientRound !== 'undefined') {
        clearClientRound();
      }
      console.log('round updates', Session.get('currentRound'));
      Meteor.subscribe('player-round-updates', Session.get('currentRound'));
    });
  }
})();
