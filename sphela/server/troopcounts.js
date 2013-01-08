var global;
global = this;
/**
 * @fileOverview The logic that updates the troop counts each tick.
 */
(function () {
  var MIN_PLAYER_TROOPS,
    REGION_TROOP_BONUS;
  /**
   * @type {number}
   * @const
   */
  MIN_PLAYER_TROOPS = 5;
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
    if (_.last(playerRound.regionCount).count === 0 &&
        _.last(playerRound.floatingTroops).count < MIN_PLAYER_TROOPS) {
      playerRound.floatingTroops.push({count: MIN_PLAYER_TROOPS,
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
  function updatePlayerTroops(round, playerRound) {
    if (updateNoRegions(playerRound)) {
      return true;
    }
    _.each(playerRound.regions, _.bind(updateRegionTroops, null, round,
      playerRound));
  }

  /**
   * @param {Object} round
   * @param {Object} playerRound
   * @param {string} region
   */
  function updateRegionTroops(round, playerRound, region) {
    var vectors, userId, newTroops, numVectorsNotOwned, roundRegions,
       existingTroops;
    userId = playerRound.userId;
    // Vectors are adjacent or otherwise attackable regions.
    vectors = regionStore[region].vectors;
    newTroops = REGION_TROOP_BONUS;
    roundRegions = round.regions;
    numVectorsNotOwned = vectors.length;
    _.each(vectors, function(vector) {
      if (!_.has(roundRegions, vector)) {
        return;
      }
      if (_.last(roundRegions[vector].owner).userId === userId) {
        numVectorsNotOwned -= 1;
        newTroops += 1;
      }
    });
    if (numVectorsNotOwned < 1) {
      // If all vectors are owned, bonus is an extra troop for each vector.
      newTroops += vectors.length;
    }
    existingTroops = _.last(roundRegions[region].troopCount).count;
    roundRegions[region].troopCount.push({
      count: existingTroops + newTroops,
      when: new Date().getTime()
    });
  }

  function updateTroopCounts() {
    var playerRounds, round;
    console.log('updating troop counts!');
    round = currentRound();
    if (!round) {
      return;
    }
    playerRounds = PlayerRounds.find({round:round.round});
    playerRounds.forEach(_.bind(updatePlayerTroops, null, round));
    Rounds.update({_id: round._id}, round, global.NOOP);
  }
  global.updateTroopCounts = updateTroopCounts;
})();
