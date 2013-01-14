var global;
global = this;
/**
 * @fileOverview The logic that updates the troop counts each tick.
 */
(function () {
  var MIN_CREDITS,
    REGION_TROOP_BONUS;
  /**
   * @type {number}
   * @const
   */
  MIN_CREDITS = 5;
  /**
   * The minimum number of troops received for owning a region.
   * @type {number}
   * @const
   */
  REGION_TROOP_BONUS = 3;

  /**
   * Updates floating troops if no regions are owned if the user has less than
   * the minimum number of troops.
   * @param {Object} playerRound
   * @return {boolean} Returns true if user has no regions.
   */
  function updateNoRegions(playerRound) {
    if (_.last(playerRound.regionCount).count === 0) {
      playerRound.credits.push({count: MIN_CREDITS,
        when: new Date().getTime()});
      PlayerRounds.update({_id: playerRound._id}, playerRound, global.NOOP);
      return true;
    }
    return false;
  }

  /**
   * @param {Object} round
   * @param {Object} playerRound
   */
  function updatePlayerCredits(round, playerRound) {
    if (updateNoRegions(playerRound)) {
      return true;
    }
    credits = _.reduce(playerRound.regions, _.bind(updateRegionCredits,
      null, round, playerRound), _.last(playerRound.credits).count || 0);
    playerRound.credits.push({count: credits, when: new Date().getTime()});
    PlayerRounds.update({_id: playerRound._id}, playerRound, global.NOOP);
  }

  /**
   * @param {Object} round
   * @param {Object} playerRound
   * @param {string} region
   * @param {number} credits
   */
  function updateRegionCredits(round, playerRound, credits, region) {
    var vectors, userId, newCredits, numVectorsNotOwned, roundRegions,
       existingTroops;
    userId = playerRound.userId;
    // Vectors are adjacent or otherwise attackable regions.
    vectors = regionStore[region].vectors;
    newCredits = REGION_TROOP_BONUS;
    roundRegions = round.regions;
    numVectorsNotOwned = vectors.length;
    _.each(vectors, function(vector) {
      if (!_.has(roundRegions, vector)) {
        return;
      }
      if (_.isEmpty(roundRegions[vector].owner)) {
        // Happens when an empty region was attacked but attacker lost.
        return;
      }
      if (_.last(roundRegions[vector].owner).userId === userId) {
        numVectorsNotOwned -= 1;
        newCredits += 1;
      }
    });
    if (numVectorsNotOwned < 1) {
      // If all vectors are owned, bonus is an extra troop for each vector.
      newCredits += vectors.length;
    }
    return newCredits + credits;
  }

  function updateCredits() {
    var playerRounds, round;
    round = currentRound();
    if (!round) {
      return;
    }
    playerRounds = PlayerRounds.find({round:round.round});
    playerRounds.forEach(_.bind(updatePlayerCredits, null, round));
    Rounds.update({_id: round._id}, round, global.NOOP);
  }
  global.updateCredits = updateCredits;
})();
