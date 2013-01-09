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
    var round, availTroops, owner, regionData, username, user, toRegionObj;
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
      return
    }
    // Don't allow user to attack own region.
    if (userOwnsRegion(userId, toRegion, round)) {
      return
    }
    // Validate user has enough troops in the region or use min amount.
    availTroops = getAvailTroops(round, fromRegion);
    attackTroops = availTroops < attackTroops ? availTroops : attackTroops;
    round = currentRoundNumber();
    toRegionObj = regionStore[toRegion];
    // Remove attack troops from region.
    setRegionTroopCount(round, fromRegion, availTroops - attackTroops);
    // Call attack.
    outcome = attackRegion(userId, round, toRegion, attackTroops);
    if (outcome) {
      addMessage([
          username,
          'has taken',
          toRegionObj.name + '.'
      ].join(' '), 'attack');
      addPlayerRoundMessage(userId, round, [
        'Your attack on',
        toRegionObj.name,
        'succeeded.'
        ].join(' '));
    } else {
      addPlayerRoundMessage(userId, round, [
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
    var defenderId, outcome, attacker, attackername, regionObj;
    defenderId = regionOwner(round, region);
    if (!defenderId) {
      outcome = attackEmptyRegion(attackerId, round, region, attackTroops);
    } else {
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
    setRegionTroopCount(round, region, outcome.troopsLeft);
    if (outcome.attackerWin) {
      setRegionOwner(attackerId, round, region);
    }
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
    var defendTroops, round;
    round = Rounds.findOne({round: currentRoundNumber()});
    defendTroops = getAvailTroops(round, region);
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
})();
