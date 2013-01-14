var combat, global;
global = this;
combat = {};
(function () {
  var MAX_DROP_TROOPS,
    MIN_COMBAT_DAMAGE,
    MAX_COMBAT_DAMAGE;
  /**
   * Maxmimum troops that can be used in drop.
   * @type {number}
   * @const
   */
  MAX_DROP_TROOPS = 5;
  /**
   * The minimum damage one troop can do.
   * @type {number}
   * @const
   */
  MIN_COMBAT_DAMAGE = 1;
  /**
   * The maximum damage one troop can do.
   * @type {number}
   * @const
   */
  MAX_COMBAT_DAMAGE = 6;
  /**
   * A drop attack. Available when users have no territory.
   * @param {string} userId
   * @param {string} region
   */
  function dropAttack(userId, region) {
    var attackTroops, round, regionObj, user, username, playerRound;
    user = Meteor.users.findOne({_id: userId});
    if (!user) {
      return;
    }
    username = user.profile.name;
    regionObj = regionStore[region];
    round = currentRoundNumber();
    playerRound = PlayerRounds.findOne({userId: userId, round:round});
    if (!playerRound || _.last(playerRound.regionCount).count !== 0) {
      return;
    }
    attackTroops = playerFloatingTroops(userId, round);
    if (!attackTroops) {
      addPlayerRoundMessage(userId, round, [
        'Your attack on',
        regionObj.name,
        'failed, you have no troops.'
        ].join(' '), 'attack-failure');
      return;
    }
    if (attackTroops > MAX_DROP_TROOPS) {
      setPlayerFloatingTroops(userId, round, attackTroops - MAX_DROP_TROOPS);
      attackTroops = MAX_DROP_TROOPS;
    } else {
      setPlayerFloatingTroops(userId, round, 0);
    }
    outcome = attackRegion(userId, round, region, attackTroops);
    if (outcome) {
      addMessage([
          username,
          'has dropped on',
          regionObj.name + '.'
      ].join(' '), 'attack');
      addPlayerRoundMessage(userId, round, [
        'Your attack on',
        regionObj.name,
        'succeeded.'
        ].join(' '));
    } else {
      addPlayerRoundMessage(userId, round, [
        'Your attack on',
        regionObj.name,
        'failed.'
        ].join(' '));
    }
  }
  combat.dropAttack = dropAttack;

  /**
   * @param {string} userId
   * @param {string} region
   * @param {Object} round
   * @return {boolean}
   */
  function userOwnsRegion(userId, region, round) {
    var regionData;
    if (!_.has(round.playerInfo, userId)) {
      return false;
    }
    if (!_.has(round.regions, region)) {
      return false;
    }
    regionData = round.regions[region];
    if (!regionData || _.isEmpty(regionData.owner)) {
      return;
    }
    owner = _.last(regionData.owner);
    if (owner) {
      return owner.userId === userId;
    }
    return false;
  }

  /**
   * @param {Object} round
   * @param {string} region
   * @return {number}
   */
  function getAvailTroops(round, region) {
    var regionData;
    regionData = round.regions[region];
    if (!regionData) {
      throw 'Invalid region provided to getAvailTroops.';
    }
    if (_.isEmpty(regionData.owner)) {
      return global.EMPTY_REGION_TROOPS;
    }
    return _.last(regionData.troopCount).count || 0;
  }

  /**
   * @param {string} userId
   * @param {string} fromRegion
   * @param {string} toRegion
   * @param {number} attackTroops
   */
  function attack(userId, fromRegion, toRegion, attackTroops) {
    var round, availTroops, owner, regionData, username, user, toRegionObj,
        vectors;
    user = Meteor.users.findOne({_id: userId});
    if (!user) {
      return;
    }
    username = user.profile.name;
    round = Rounds.findOne({round: currentRoundNumber()});
    if (!_.has(round.regions, fromRegion)) {
      return;
    }
    // Validate user owns region.
    if (!userOwnsRegion(userId, fromRegion, round)) {
      return;
    }
    // Don't allow user to attack own region.
    if (userOwnsRegion(userId, toRegion, round)) {
      return;
    }
    // Validate from and to regions are vectors.
    if(regionStore[fromRegion].vectors.indexOf(toRegion) === -1) {
      return;
    }
    // Validate user has enough troops in the region or use min amount.
    availTroops = getAvailTroops(round, fromRegion);
    attackTroops = availTroops < attackTroops ? availTroops : attackTroops;
    toRegionObj = regionStore[toRegion];
    // Remove attack troops from region.
    setRegionTroopCount(round.round, fromRegion, availTroops - attackTroops,
      true);
    // Call attack.
    outcome = attackRegion(userId, round.round, toRegion, attackTroops);
    if (outcome) {
      addMessage([
          username,
          'has taken',
          toRegionObj.name + '.'
      ].join(' '), 'attack');
      addPlayerRoundMessage(userId, round.round, [
        'Your attack on',
        toRegionObj.name,
        'succeeded.'
        ].join(' '));
    } else {
      addPlayerRoundMessage(userId, round.round, [
        'Your attack on',
        toRegionObj.name,
        'failed.'
        ].join(' '));
    }
  }
  combat.attack = attack;

  /**
   * @param {string} attackerId
   * @param {number} round
   * @param {string} region
   * @param {number} attackTroops
   * @return {boolean} Whether attack succeeded.
   */
  function attackRegion(attackerId, round, region, attackTroops) {
    var defender, defenderId, outcome, attacker, attackername, regionObj;
    defender = regionOwner(round, region);
    if (!defender) {
      outcome = attackEmptyRegion(attackerId, round, region, attackTroops);
    } else {
      defenderId = defender.userId;
      outcome = attackOwnedRegion(attackerId, defenderId, round, region,
        attackTroops);
      // Let defender know region was attacked and troops left.
      attacker = Meteor.users.findOne({_id: attackerId});
      if (!attacker) {
        throw 'Invalid attackerId in attackRegion';
      }
      attackername = attacker.profile.name;
      regionObj = regionStore[region];
      if (outcome.attackerWin) {
        addPlayerRoundMessage(defenderId, round, [
          'You lost',
          regionObj.name,
          'to',
          attackername + '.'
          ].join(' '), 'attack-failure');
      } else {
        addPlayerRoundMessage(defenderId, round, [
          attackername,
          'attacked',
          regionObj.name + '.',
          outcome.troopsLeft,
          'troops left' + '.'
          ].join(' '), 'attack-failure');
      }
    }
    if (outcome.attackerWin) {
      setRegionOwner(attackerId, round, region);
    }
    setRegionTroopCount(round, region, outcome.troopsLeft, true);
    updatePlayerTotalTroops(attackerId, roundObj);
    return outcome.attackerWin;
  }

  /**
   * @param {string} attackerId
   * @param {string} defenderId
   * @param {number} round
   * @param {string} region
   * @param {number} attackTroops
   * @return {boolean} Whether attack succeeded
   */
  function attackOwnedRegion(attackerId, defenderId, round, region,
      attackTroops) {
    var defendTroops, roundObj;
    roundObj = Rounds.findOne({round: round});
    defendTroops = getAvailTroops(roundObj, region);
    return combat_(attackTroops, defendTroops);
  }

  /**
   * @param {string} attackerId
   * @param {number} round
   * @param {string} region
   * @param {number} attackTroops
   * @return {boolean} Whether attack succeeded.
   */
  function attackEmptyRegion(attackerId, round, region, attackTroops) {
    return combat_(attackTroops, global.EMPTY_REGION_TROOPS);
  }

  /**
   * @param {number} attackTroops
   * @param {number} defendTroops
   * @return {Object} Returns combat results.
   */
  function combat_(attackTroops, defendTroops) {
    var attackerDamage, defenderDamage, results, min, max;
    min = MIN_COMBAT_DAMAGE;
    max = MAX_COMBAT_DAMAGE;
    attackerDamage = defenderDamage = 0;
    // Yup, you will gain troops by beating a larger force:
    results = {troopsLeft: Math.abs(attackTroops - defendTroops)};
    while (attackTroops--) {
      attackerDamage += Math.floor(Math.random() * (max - min + 1)) + min;
    }
    while (defendTroops--) {
      defenderDamage += Math.floor(Math.random() * (max - min + 1)) + min;
    }
    results.attackerWin = attackerDamage > defenderDamage;
    return results;
  }

  /**
   * @param {string} userId
   * @param {string} fromRegion
   * @param {string} toRegion
   * @param {number} moveTroops
   */
  function move(userId, fromRegion, toRegion, moveTroops) {
    var vectors, round, regions, availTroops, existingTroops;
    round = Rounds.findOne({round: currentRoundNumber()});
    if (!_.has(round.regions, fromRegion)) {
      return;
    }
    if (!_.has(round.regions, toRegion)) {
      return;
    }
    if(regionStore[fromRegion].vectors.indexOf(toRegion) === -1) {
      return;
    }
    if (!userOwnsRegion(userId, fromRegion, round)) {
      return;
    }
    if (!userOwnsRegion(userId, toRegion, round)) {
      return;
    }
    availTroops = getAvailTroops(round, fromRegion);
    existingTroops = getAvailTroops(round, toRegion);
    moveTroops = availTroops < moveTroops ? availTroops : moveTroops;
    setRegionTroopCount(round.round, fromRegion, availTroops - moveTroops);
    setRegionTroopCount(round.round, toRegion,  moveTroops + existingTroops);
    fromRegionObj = regionStore[fromRegion];
    toRegionObj = regionStore[toRegion];
    addPlayerRoundMessage(userId, round.round, [
      'You moved',
      moveTroops,
      'troops to',
      toRegionObj.name,
      'from',
      fromRegionObj.name
      ].join(' '), 'move');
  }
  combat.move = move;
  /**
   * @param {string} userId
   * @param {string} target
   * @param {number} buyTroops
   */
  function buy(userId, target, buyTroops) {
    var vectors, round, regions, availCredits, existingTroops, playerRound,
      roundNumber, left, regionObj;
    regionObj = regionStore[target];
    if (!regionObj) {
      return;
    }
    roundNumber = currentRoundNumber();
    round = Rounds.findOne({round: roundNumber});
    if (!_.has(round.regions, target)) {
      return;
    }
    if (!userOwnsRegion(userId, target, round)) {
      return;
    }
    playerRound = PlayerRounds.findOne({userId: userId, round: roundNumber});
    if (!playerRound) {
      return;
    }
    availCredits = _.last(playerRound.credits).count;
    existingTroops = getAvailTroops(round, target);
    buyTroops = availCredits < buyTroops ? availCredits : buyTroops;
    left = availCredits - buyTroops;
    playerRound.credits.push({count: left, when: new Date().getTime()});
    PlayerRounds.update({_id: playerRound._id}, playerRound, global.NOOP);
    setRegionTroopCount(round.round, target,  buyTroops + existingTroops);
    addPlayerRoundMessage(userId, round.round, [
      'You bought',
      buyTroops,
      'for',
      regionObj.name + '.',
      ].join(' '), 'move');
  }
  combat.buy = buy;
})();
