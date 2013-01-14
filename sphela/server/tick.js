var global;
global = this;
/**
 * @fileOverview The logic that updates the troop counts each tick.
 */
(function () {
  var MIN_CREDITS,
    MIN_TROOP_COUNT,
    REGION_TROOP_BONUS;
  /**
   * @type {number}
   * @const
   */
  MIN_CREDITS = MIN_TROOP_COUNT = 5;
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
   * @param {Object} round
   * @return {boolean} Returns true if user has no regions.
   */
  function updateNoRegions(playerRound, round) {
    var credits;
    if (_.last(playerRound.regionCount).count === 0) {
      credits = _.last(playerRound.credits).count || 0;
      credits += MIN_CREDITS;
      playerRound.credits.push({count: credits,
        when: new Date().getTime()});
      playerRound.floatingTroops.push({count: MIN_TROOP_COUNT,
        when: new Date().getTime()});
      PlayerRounds.update({_id: playerRound._id}, playerRound, global.NOOP);
      round.playerInfo[playerRound.userId].credits = credits;
      return true;
    }
    return false;
  }

  /**
   * @param {Object} round
   * @param {Object} playerRound
   */
  function updatePlayerCredits(round, playerRound) {
    if (!updateNoRegions(playerRound, round)) {
      credits = _.reduce(playerRound.regions, _.bind(updateRegionCredits,
        null, round, playerRound), _.last(playerRound.credits).count || 0);
      playerRound.credits.push({count: credits, when: new Date().getTime()});
      PlayerRounds.update({_id: playerRound._id}, playerRound, global.NOOP);
      round.playerInfo[playerRound.userId].credits = credits;
    }
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

  /**
   * @param {string} property
   * @param {Object} a
   * @param {Object} b
   * @return {number}
   */
  function sortByProperty(property, a, b) {
    if (a[property] < b[property]) {
      return 1;
    }
    if (a[property] > b[property]) {
      return -1;
    }
    return 0;
  }

  /**
   * @param {Object} topStats
   * @param {Object} round
   */
  function updateTopTroops(topStats, round) {
    var top;
    top = [];
    _.each(round.playerInfo, function(info, userId) {
      top.push({
        userId: userId,
        name: info.name,
        color: info.color,
        count: info.totalTroops
      });
    });
    top.sort(_.bind(sortByProperty, null, 'count'));
    topStats.topPlayerTroops = top;
  }

  /**
   * @param {Object} topStats
   * @param {Object} round
   */
  function updateTopRegions(topStats, round) {
    var top;
    top = [];
    _.each(round.playerInfo, function(info, userId) {
      top.push({
        userId: userId,
        color: info.color,
        name: info.name,
        count: info.regions.length
      });
    });
    top.sort(_.bind(sortByProperty, null, 'count'));
    topStats.topPlayerRegions = top;
  }

  /**
   * @param {Object} topStats
   * @param {Object} round
   */
  function updateTopCredits(topStats, round) {
    var top;
    top = [];
    _.each(round.playerInfo, function(info, userId) {
      top.push({
        userId: userId,
        color: info.color,
        name: info.name,
        count: info.credits
      });
    });
    top.sort(_.bind(sortByProperty, null, 'count'));
    topStats.topPlayerCredits = top;
  }

  /**
   * @param {Object} topStats
   * @param {Object} round 
   */
  function updateTopRegionsTroops(topStats, round) {
    var top;
    top = [];
    _.each(round.regions, function(info, region) {
      var owner, userId, playerInfo;
      owner = _.last(info.owner);
      if (!owner) {
        return;
      }
      userId = owner.userId;
      if (!_.has(round.playerInfo, userId)) {
        return;
      }
      playerInfo = round.playerInfo[userId];
      top.push({
        region: region,
        regionName: regionStore[region].name,
        userId: userId,
        color: playerInfo.color,
        playerName: playerInfo.name,
        troopCount: _.last(info.troopCount).count || 0
      });
    });
    top.sort(_.bind(sortByProperty, null, 'troopCount'));
    topStats.topRegionTroops = top;
  }

  function updateTopStats() {
    var topStats, round;
    round = Rounds.findOne({round: currentRoundNumber()});
    if (!round) {
      return;
    }
    topStats = TopStats.findOne({round: round.round});
    if (!topStats) {
      return;
    }
    updateTopTroops(topStats, round);
    updateTopRegions(topStats, round);
    updateTopCredits(topStats, round);
    updateTopRegionsTroops(topStats, round);
    TopStats.update({_id: topStats._id}, topStats, global.NOOP);
  }
  global.updateTopStats = updateTopStats;
})();
