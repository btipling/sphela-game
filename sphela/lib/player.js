(function() {
  if (Meteor.isClient) {
    $(function () {
      Session.set('attackTroops', 0);
      Session.set('moveTroops', 0);
    });

    /**
     * @return {boolean}
     */
    function isAttacking() {
      var selectedTab;
      selectedTab = Session.get('selectedAttackTab');
      if (!selectedTab) {
        return true;
      }
      return  selectedTab === 'attack-region';
    }

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
     * @return {boolean?}
     */
    function troopDownTrend() {
      var last, penultimate, playerRound, userId, round, troops;
      userId = Meteor.userId();
      round = clientCurrentRoundNumber();
      if (!userId) {
        return null;
      }
      playerRound = PlayerRounds.findOne({userId: userId, round: round});
      if (!playerRound) {
        return null;
      }
      troops = playerRound.totalTroops;
      if (!troops || _.isEmpty(troops) || troops.length < 2) {
        return null;
      }
      last = _.last(troops).count;
      penultimate = troops[troops.length-2].count;
      return last < penultimate;
    }

    /**
     * @return {boolean}
     */
    Template.playerCounts.upTrend = function () {
      var result;
      result = troopDownTrend();
      if (_.isNull(result)) {
        return false;
      }
      return !result;
    }

    /**
     * @return {boolean}
     */
    Template.playerCounts.downTrend = function () {
      var result;
      result = troopDownTrend();
      if (_.isNull(result)) {
        return false;
      }
      return result;
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
    Template.playerCounts.totalTroops = function() {
      var playerRound, userId;
      userId = Meteor.userId();
      if (!userId) {
        return 0;
      }
      playerRound = PlayerRounds.findOne({userId: userId,
        round: clientCurrentRoundNumber()});
      if (!playerRound) {
        return 0;
      }
      return _.last(playerRound.totalTroops).count;
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
    function canSelectTarget(opt_region, opt_playerRound, opt_round) {
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

    /**
     * @return {Boolean}
     */
    Template.targetSelection.canSelectTarget = function () {
      return canSelectTarget();
    };

    /**
     * @param {Function} filterFunc
     * @return {Array.<Object>}
     */
    function targetSelection(filterFunc) {
      var source, vectors, selected;
      vectors = getVectors(filterFunc);
      selected = getSelected(vectors);
      return _.map(vectors, function(vector) {
        return {
          selected: vector === selected,
          id: vector,
          name: regionStore[vector].name
        };
      });
    }

    /**
     * @param {Object} playerRound
     * @param {string} region
     * @return {boolean}
     */
    function filterNonTargetsOut(playerRound, region) {
        return _.indexOf(playerRound.regions, region) === -1;
    }

    /**
     * @param {Object} playerRound
     * @param {string} region
     * @return {boolean}
     */
    function filterOutTargets(playerRound, region) {
        return _.indexOf(playerRound.regions, region) !== -1;
    }

    /**
     * @return {Array.<Object>}
     */
    Template.targetSelection.targets = _.bind(targetSelection, null,
        filterNonTargetsOut);

    /**
     * @param {Function=} opt_filterFunc
     * @return {Array.<Object>}
     */
    function getVectors(opt_filterFunc) {
      var source, playerRound;
      if (typeof regionStore === 'undefined') {
        return [];
      }
      source = Session.get('selectedRegion');
      if (!source) {
        return [];
      }
      playerRound = getPlayerRound();
      if (!canSelectTarget(source, playerRound)) {
        return [];
      }
      if (_.isFunction(opt_filterFunc)) {
        vectors = _.filter(regionStore[source.id].vectors,
            _.bind(opt_filterFunc, null, playerRound));
      } else {
        vectors = regionStore[source.id].vectors;
      }
      if (_.isEmpty(vectors)) {
        return [];
      }
      return vectors;
    }

    /**
     * @param {Array} bectors
     * @param {Function=}  opt_filterFunc
     * return {Object}
     */
    function getSelected(vectors, opt_filterFunc) {
      var filterFunc, target, filtered;
      if (_.isFunction(opt_filterFunc)) {
        filterFunc = opt_filterFunc;
      } else {
        filterFunc = filterNonTargetsOut;
      }
      target = Session.get('selectedTarget');
      filtered = _.filter(vectors, _.bind(filterFunc, null, getPlayerRound()));
      if (_.indexOf(filtered, target) === -1) {
        return _.first(filtered);
      }
      return target;
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
     * @param {boolean} attacking
     * @return {number}
     */
    function getTroopFactor(attacking) {
      if (attacking) {
        return (parseInt($('.attack-num-range').val(), 10)/100);
      } else {
        return (parseInt($('.move-num-range').val(), 10)/100);
      }
    }

    Meteor.autorun(function() {
      var vectors, selected, attacking;
      vectors = getVectors();
      attacking = isAttacking();
      if (attacking) {
        selected = getSelected(vectors, filterNonTargetsOut);
      } else {
        selected = getSelected(vectors, filterOutTargets);
      }
      setSelectedTarget(selected);
      Session.set(attacking ? 'attackTroops' : 'moveTroops',
        Math.floor(getRegionTroops() * getTroopFactor(attacking)));
    });

    /**
     * @return {Array.<Object>}
     */
    Template.sourceSelection.sources = function() {
      var playerRound, availableRegions, round, selectedRegion, selects,
        hasSelection;
      playerRound = getPlayerRound();
      if (!playerRound || _.isEmpty(playerRound.regions)) {
        return [];
      }
      round = Rounds.findOne({round: clientCurrentRoundNumber()});
      if (!round) {
        return [];
      }
      availableRegions = _.filter(playerRound.regions, function(region) {
        return canSelectTarget({id: region}, playerRound, round);
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
          name: 'Select a region',
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
     * @param {Object} event
     */
    function handleTabSelection(event) {
      var target, tab;
      event.preventDefault();
      target = event.target;
      tab = _.last(target.href.split('#'));
      Session.set('selectedAttackTab', tab);
    }

    /**
     * @return {boolean}
     */
    Template.territoryWarScreen.isAttacking = function() {
      return isAttacking();
    }

    Template.territoryWarScreen.preserve([
      '#war-tabs'
    ]);

    Template.territoryWarScreen.events({
      'click .nav-tabs li': handleTabSelection
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
      var key, attacking;
      attacking = isAttacking();
      if (attacking) {
        key = 'attackTroops';
      } else {
        key = 'moveTroops';
      }
      if (userOwnsRegion(Session.get('selectedRegion'))) {
        Session.set(key,
            Math.floor(getRegionTroops() * getTroopFactor(attacking)));
      } else {
        Session.set(key, 0);
      }
    }

    /**
     * @param {Object} event
     */
    function handleTroopInput(event) {
      var regionTroops, num, troops;
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

    /**
     * @return {Array}
     */
    Template.moveTargetSelection.targets = _.bind(targetSelection, null,
      filterOutTargets);

    /**
     * @return {Boolean}
     */
    Template.moveTargetSelection.canSelectTarget = function () {
      return canSelectTarget();
    };

    /**
     * @return {number}
     */
    Template.moveForm.troops = function() {
      return Session.get('moveTroops') || 0;
    }

    /**
     * @param {Object} event
     */
    function handleMoveTroopInput(event) {
      var regionTroops, num, troops;
      regionTroops = getRegionTroops();
      num = parseInt($('.move-num-input').val(), 10);
      $('.move-num-range').val(100 * (num/regionTroops));
      Session.set('moveTroops', num);
    }

    /**
     * @param {Object} event
     */
    function handleMove(event) {
      var moveTroops, fromRegion, toRegion;
      event.preventDefault();
      fromRegion = Session.get('selectedRegion');
      if (!fromRegion) {
        return;
      }
      toRegion = Session.get('selectedTarget');
      moveTroops = Session.get('moveTroops');
      if (fromRegion && toRegion && moveTroops) {
        Meteor.call('move', fromRegion.id, toRegion, moveTroops);
      }
    }

    Template.moveForm.events({
      'submit .move-form': handleMove,
      'change .move-num-range': handleTroopRange,
      'keyup .move-num-input': handleMoveTroopInput
    });

    Template.moveForm.preserve([
      '.move-num-range'
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
