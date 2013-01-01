var combat = {};
(function () {
  var MAX_DROP_TROOPS, 
    EMPTY_REGION_TROOPS,
    MIN_COMBAT_DAMAGE,
    MAX_COMBAT_DAMAGE;
  /**
   * Maxmimum troops that can be used in drop.
   * @type {number}
   * @const
   */
  MAX_DROP_TROOPS = 5;
  /**
   * The troop count in an empty region.
   * @type {number}
   * @const
   */
  EMPTY_REGION_TROOPS = 3;
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
    var attackTroops, round, regionObj, user, username;
    user = Meteor.users.findOne({_id: userId});
    if (!user) {
      return;
    }
    username = user.profile.name;
    regionObj = regionStore[region];
    round = currentRoundNumber();
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
    outcome = combat_(attackTroops, EMPTY_REGION_TROOPS);
    if (outcome.attackerWin) {
      setRegionOwner(userId, round, region);
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
