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
   * @param {string} fromRegion
   * @param {string} toRegion
   * @param {number} attackTroops
   */
  function attack(userId, fromRegion, toRegion, attackTroops) {
    var round, availTroops, owner, regionData, username, user, regionObj;
    user = Meteor.users.findOne({_id: userId});
    if (!user) {
      return;
    }
    username = user.profile.name;
    //Validate user owns region.      
    round = Rounds.findOne({round: currentRoundNumber()});
    if (!_.has(round.playerInfo, userId)) {
      return;
    }
    if (!_.has(round.regions, fromRegion)) {
      return;
    }
    regionData = round.regions[fromRegion];
    if (!regionData || _.isEmpty(regionData.owner)) {
      return;
    }
    //
    // Validate that user doesn't own attacking region.
    //
    owner = _.last(regionData.owner);
    if (!owner || owner.userId !== userId) {
      return;
    }
    // Validate user has enough troops in the region or use min amount.
    availTroops = _.last(regionData.troopCount).count || 0;
    attackTroops = availTroops < attackTroops ? availTroops : attackTroops;
    round = currentRoundNumber();
    // Remove attack troops from region.
    setRegionTroopCount(round, fromRegion, availTroops - attackTroops);
    // Call attack.
    outcome = attackRegion(userId, round, toRegion, attackTroops);
    if (outcome) {
      regionObj = regionStore[fromRegion];
      addMessage([
          username,
          'has taken',
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
  combat.attack = attack;

  /**
   * @param {string} userId
   * @param {number} round
   * @param {string} region
   * @param {number} attackTroops
   * @return {boolean} Whether attack succeeded.
   */
  function attackRegion(userId, round, region, attackTroops) {
    var defensePlayerRound, attackPlayerRound, defenderId;
    defenderId = regionOwner(round, region);
    if (!defenderId) {
      return attackEmptyRegion(userId, round, region, attackTroops);
    }
  }

  /**
   * @param {string} userId
   * @param {number} round
   * @param {string} region
   * @param {number} attackTroops
   * @return {boolean} Whether attack succeeded.
   */
  function attackEmptyRegion(userId, round, region, attackTroops) {
    var attackPlayerRound, outcome;
    attackPlayerRound = PlayerRounds.findOne({userId: userId, round: round});
    if (!attackPlayerRound) {
      return false;
    }
    outcome = combat_(attackTroops, global.EMPTY_REGION_TROOPS);
    if (outcome.attackerWin) {
      console.log('setting winner', userId, round, region);
      setRegionOwner(userId, round, region);
      console.log('setting troops', region, outcome);
      setRegionTroopCount(round, region, outcome.troopsLeft);
      return true;
    }
    return false;
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
