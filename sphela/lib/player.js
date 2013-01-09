(function() {
  if (Meteor.isClient) {
    $(function () {
      Session.set('attackTroops', 0);
    });

    /**
     * @param {Object} event
     */
    function joinRound(event) {
      var userId;
      userId = Meteor.userId();
      if (userId) {
        Meteor.call('joinRound', global.NOOP);
      }
    }

    /**
     * return {number}
     */
    Template.playerCounts.regions = function() {
      var userId, regions;
      userId = Meteor.userId();
      if (!userId) {
        return 0;
      }
      regions = playerRegions(userId, clientCurrentRoundNumber());
      return regions ? regions.length || 0 : 0;
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
      game = Games.findOne();
      userId = Meteor.userId();
      if (!game || !userId) {
        return false;
      }
      player = Players.findOne({userId: userId});
      if (!player) {
        return false;
      }
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
      return playerRound.messages.reverse();
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
      var source, vectors, selected;
      vectors = getVectors();
      selected = getSelected(vectors);
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
    function getVectors() {
      var source, playerRound;
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
      return vectors;
    }

    /**
     * @param {Array} bectors
     * return {Object}
     */
    function getSelected(vectors) {
      return Session.get('selectedTarget') || _.first(vectors);
    }

    /**
     * @param {string} region
     */
    function setSelectedTarget(region) {
      Session.set('selectedTarget', region);
      d3.select('.targeted').classed('targeted', false);
      d3.select('#' + region).classed('targeted', true);
    }

    /**
     * @return {number}
     */
    function getRegionTroops() {
      var id, round, region, troopCount, setCount;
      round = Rounds.findOne({round: clientCurrentRoundNumber()});
      region = Session.get('selectedRegion');
      if (region && round && _.has(round.regions, region.id)) {
        troopCount =_.last(round.regions[region.id].troopCount)
        return troopCount.count;
      }
      return 0;
    }

    /**
     * @param {number}
     */
    function getTroopFactor() {
      return (parseInt($('.attack-num-range').val(), 10)/100);
    }

    Meteor.autorun(function() {
      var vectors, selected;
      vectors = getVectors();
      selected = getSelected(vectors);
      setSelectedTarget(selected);
      Session.set('attackTroops', Math.floor(getRegionTroops() * getTroopFactor()));
    });

    /**
     * @return {Array.<Object>}
     */
    Template.sourceSelection.sources = function() {
      var playerRound, availableRegions, round, selectedRegion, selects, hasSelection;
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
      availableRegions.sort(function(a, b) {
        return regionStore[a].name.localeCompare(regionStore[b].name);
      });
      selectedRegion = Session.get('selectedRegion');
      hasSelection = false;
      selects = _.map(availableRegions, function(region) {
        var isSelected;
        isSelected = false;
        if (!hasSelection && selectedRegion && selectedRegion.id === region) {
          hasSelection = isSelected = true;
        }
        return {
          selected: isSelected,
          disabled: false,
          name: regionStore[region].name,
          id: region
        };
      });
      if (!hasSelection) {
        selects.unshift({
          selected: true,
          name: 'Select a region to attack from',
          id: '',
          disabled: true
        });
      }
      return selects;
    }

    /**
     * @param {Object} event
     */
    function handleSourceSelect(event) {
      var id, regions;
      id = $(event.target).val();
      regions = _.where(dataStore.features, {id: id});
      if (!regions || _.isEmpty(regions)) { 
        return;
      }
      global.selectRegion(_.first(regions));
    }

    Template.sourceSelection.events({
      'change .source-selector': handleSourceSelect
    });


    /**
     * @param {Object} event
     */
    function handleTargetSelection(event) {
      setSelectedTarget($(event.target).val());
    }

    Template.targetSelection.events({
      'change .target-selector': handleTargetSelection
    });

    /**
     * @return {number}
     */
    Template.attackForm.troops = function() {
      return Session.get('attackTroops') || 0;
    };

    /**
     * @param {Object} event
     */
    function handleAttack(event) {
      var attackTroops, fromRegion, toRegion;
      event.preventDefault();
      fromRegion = Session.get('selectedRegion');
      if (!fromRegion) {
        return;
      }
      toRegion = Session.get('selectedTarget');
      attackTroops = Session.get('attackTroops');
      if (fromRegion && toRegion && attackTroops) {
        Meteor.call('attack', fromRegion.id, toRegion, attackTroops);
      }
    }

    /**
     * @param {Object} region
     * @return {boolean}
     */
    function userOwnsRegion(region) {
      var userId, round;
      userId = Meteor.userId();
      if (!userId) {
        return false;
      }
      round = Rounds.findOne({round: clientCurrentRoundNumber()});
      if (region && round && _.has(round.playerInfo, userId)) {
        return _.indexOf(round.playerInfo[userId].regions, region.id) !== -1;
      }
    }

    /**
     * @param {Object} event
     */
    function handleTroopRange(event) {
      if (userOwnsRegion(Session.get('selectedRegion'))) {
        Session.set('attackTroops', Math.floor(getRegionTroops() * getTroopFactor()));
      } else {
        Session.set('attackTroops', 0);
      }
    }

    /**
     * @param {Object} event
     */
    function handleTroopInput(event) {
      var regionTroops, num;
      regionTroops = getRegionTroops();
      num = parseInt($('.attack-num-input').val(), 10);
      $('.attack-num-range').val(100 * (num/regionTroops));
      Session.set('attackTroops', num);
    }

    Template.attackForm.events({
      'submit .attack-form': handleAttack,
      'change .attack-num-range': handleTroopRange,
      'keyup .attack-num-input': handleTroopInput
    });

    Template.attackForm.preserve([
      '.attack-num-range'
    ]);

    Meteor.autosubscribe(function() {
      var game;
      game = Games.findOne();
      if (!game) {
        return;
      }
      Meteor.subscribe('players', Meteor.userId(), game.currentRound);
    });
    Meteor.autosubscribe(function() {
      if (typeof clearClientRound !== 'undefined') {
        clearClientRound();
      }
      Meteor.subscribe('player-round-updates', Session.get('currentRound'));
    });
  }
})();
