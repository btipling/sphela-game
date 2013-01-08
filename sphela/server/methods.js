/**
 * @fileOverview The methods a client can call.
 */
(function() {
  /**
   * @param {string} userId
   * return {!string}
   */
  function getUsername(userId) {
    var user;
    user = Meteor.users.findOne({_id: userId});
    if (!user) {
      return null;
    }
    return user.profile.name;
  }
  Meteor.methods({
    /**
     * Login to game.
     * @param {string} userId;
     */
    loginGame: function(userId) {
      if(userId === this.userId) {
        createPlayer(this.userId);
      }
    },
    /**
     * When a user joins the round the client calls this method.
     */
    joinRound: function() {
      var player, playerRound, round, username, userId;
      if (_.isNull(this.userId)) {
        return;
      }
      userId = this.userId;
      round = currentRoundNumber();
      player = Players.findOne({userId: userId});
      username = getUsername(userId);
      if (!username || !player) {
        return;
      }
      if (_.indexOf(player.rounds, round) === -1) {
        player.rounds.push(round);
        player.currentRound = round;
        Players.update({_id: player._id}, player);
        playerRound = addPlayerToPlayerRound(userId, round);
        addPlayerToRound(userId, username, playerRound.color);
        addMessage([
          username,
          'has joined round',
          round + '.',
        ].join(' '), 'join', userId);
      }
    },
    /**
     * User adds a chat message to updates.
     * @param {string} message
     */
    say: function(message) {
      var username, userId;
      if (_.isNull(this.userId)) {
        return;
      }
      userId = this.userId;
      username = getUsername(userId);
      if (!username || message.length === 0) {
        return;
      }
      addMessage([
        username,
        ': ',
        message
      ].join(''), 'chat', userId);
    },
    /**
     * Drop attack on a region.
     * @param {string} region
     */
    dropAttack: function(region) {
      if (_.isNull(this.userId)) {
        return;
      }
      if (!_.has(regionStore, region)) {
        return;
      }
      combat.dropAttack(this.userId, region);
    },
    /**
     * Attack a region from another region.
     * @param {string} fromRegion
     * @param {string} toRegion
     * @param {number} troops
     */
    attack: function(fromRegion, toRegion, troops) {
      if(_.isNull(this.userId)) {
        return;
      }
      if (!_.has(regionStore, fromRegion) || !_.has(regionStore, toRegion)) {
        return;
      }
      combat.attack(this.userId, fromRegion, toRegion, troops);
    }
  });
})();
