(function() {
  if (Meteor.isClient) {
    $(function () {
      Session.set('attackTroops', 0);
      Session.set('moveTroops', 0);
    });

    /**
     * @return {string}
     */
    function getTabState() {
      var selectedTab;
      selectedTab = Session.get('selectedAttackTab');
      if (!selectedTab) {
        return 'attack-region';
      }
      return selectedTab;
    }

    /**
     * @return {boolean}
     */
    function isAttacking() {
      return  getTabState() === 'attack-region';
    }

    /**
     * @return {boolean}
     */
    function isMoving() {
      return  getTabState() === 'move-troops';
    }

    /**
     * @return {boolean}
     */
    function isBuying() {
      return  getTabState() === 'buy-troops';
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
     * @return {boolean?}
     */
    function troopRegionTrend() {
      return downTrend('regionCount');
    }

    /**
     * @return {boolean?}
     */
    function troopDownTrend() {
      return downTrend('totalTroops');
    }

    /**
     * @return {boolean?}
     */
    function creditDownTrend() {
      return downTrend('credits');
    }

    /**
     * @param {string} fieldName
     * @return {boolean?}
     */
    function downTrend(fieldName) {
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
      troops = playerRound[fieldName];
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
    Template.playerCounts.upRegionsTrend = function () {
      var result;
      result = troopRegionTrend();
      if (_.isNull(result)) {
        return false;
      }
      return !result;
    }

    /**
     * @return {boolean}
     */
    Template.playerCounts.downRegionsTrend = function () {
      var result;
      result = troopRegionTrend();
      if (_.isNull(result)) {
        return false;
      }
      return result;
    }

    /**
     * @return {boolean}
     */
    Template.playerCounts.upTroopsTrend = function () {
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
    Template.playerCounts.downTroopsTrend = function () {
      var result;
      result = troopDownTrend();
      if (_.isNull(result)) {
        return false;
      }
      return result;
    }

    /**
     * @return {boolean}
     */
    Template.playerCounts.upCreditTrend = function () {
      var result;
      result = creditDownTrend();
      if (_.isNull(result)) {
        return false;
      }
      return !result;
    }

    /**
     * @return {boolean}
     */
    Template.playerCounts.downCreditTrend = function () {
      var result;
      result = creditDownTrend();
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
     * @param {string} fieldName
     * @return {number}
     */
    function getCount(fieldName) {
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
      return _.last(playerRound[fieldName]).count;
    }

    /**
     * return {number}
     */
    Template.playerCounts.regions = function() {
      return getCount('regionCount');
    }

    /**
     * @return {number}
     */
    Template.playerCounts.totalTroops = function() {
      return getCount('totalTroops');
    };

    /**
     * @return {number}
     */
    Template.playerCounts.credits = function() {
      return getCount('credits');
    };

    /**
     * @param {string} selector
     * @param {string} fieldName
     */
    function updatePlayerChart(selector, fieldName) {
      var svg, playerRound;
      svg = $(selector).get(0);
      if (!svg) {
        return;
      }
      playerRound = PlayerRounds.findOne({userId: userId,
        round: clientCurrentRoundNumber()});
      if (!playerRound) {
        return;
      }
      chart.drawLine(svg, playerRound[fieldName]);
    }

    function updateRegionChart() {
      updatePlayerChart('.regions-chart', 'regionCount');
    }

    function updateTroopChart() {
      updatePlayerChart('.troops-chart', 'totalTroops');
    }

    function updateCreditChart() {
      updatePlayerChart('.credits-chart', 'credits');
    }

    Template.playerCounts.rendered = function() {
      updateRegionChart();
      updateTroopChart();
      updateCreditChart();
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
      if (isBuying()) {
        return true;
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
      selected = getSelected(vectors, filterFunc);
      return _.map(vectors, function(vector) {
        return {
          selected: vector === selected,
          id: vector,
          name: regionStore[vector].name
        };
      });
    }

    /**
     * Filter out regions that can't be attacked because
     * they are already owned by the player.
     * @param {Object} playerRound
     * @param {string} region
     * @return {boolean}
     */
    function attackRegionFilter(playerRound, region) {
      return _.indexOf(playerRound.regions, region) === -1;
    }

    /**
     * Filter out regions that can't be moved to because
     * the player doesn't own them.
     * @param {Object} playerRound
     * @param {string} region
     * @return {boolean}
     */
    function moveRegionFilter(playerRound, region) {
        return _.indexOf(playerRound.regions, region) !== -1;
    }

    /**
     * @return {Array.<Object>}
     */
    Template.targetSelection.targets = _.bind(targetSelection, null,
        attackRegionFilter);

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
        filterFunc = attackRegionFilter;
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
        selected = getSelected(vectors, attackRegionFilter);
      } else {
        selected = getSelected(vectors, moveRegionFilter);
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
      var target, tab, href;
      event.preventDefault();
      target = event.target;
      href = target.href;
      if (!href) {
        return;
      }
      tab = _.last(href.split('#'));
      Session.set('selectedAttackTab', tab);
      if (isBuying()) {
        updatePossibleTroops();
      }
    }

    /**
     * @return {boolean}
     */
    Template.territoryWarScreen.isAttacking = function() {
      return isAttacking();
    }

    /**
     * @return {boolean}
     */
    Template.territoryWarScreen.isMoving = function() {
      return isMoving();
    }

    /**
     * @return {boolean}
     */
    Template.territoryWarScreen.isBuying = function() {
      return isBuying();
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
      moveRegionFilter);

    /**
     * @return {Boolean}
     */
    Template.moveTargetSelection.canSelectTarget = function () {
      return canSelectTarget();
    };

    Template.moveTargetSelection.events({
      'change .target-selector': handleTargetSelection
    });

    /**
     * @return {number}
     */
    Template.moveForm.troops = function() {
      return Session.get('moveTroops') || 0;
    }

    /**
     * @return {number}
     */
    updatePossibleTroops = function() {
      var playerRound, num;
      playerRound = PlayerRounds.findOne({userId: userId,
        round: clientCurrentRoundNumber()});
      if (!playerRound) {
        num = 0;
      } else {
        num = _.last(playerRound.credits).count || 0;
      }
      $('.buy-num-input').val(num);
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

    /**
     * @param {Object} event
     */
    function handleBuy(event) {
      var count, target;
      event.preventDefault();
      target = Session.get('selectedRegion');
      count = +$('.buy-num-input').val();
      if (target && count) {
        Meteor.call('buy', target.id, count);
      }
    }

    Template.buyForm.events({
      'submit .buy-form': handleBuy,
    });

    Template.buyForm.preserve([
      '.buy-num-input'
    ]);

    Template.buyForm.rendered = function() {
      if (!$('buy-num-input').val()) {
        updatePossibleTroops();
      }
    };

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
