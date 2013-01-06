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
     * When a user joins the round the client calls this method.
     */
    joinRound: function() {
      var player, playerRound, round, username, userId;
      console.log('joining');
      if (_.isNull(this.userId)) {
        return;
      }
      userId = this.userId;
      console.log('joining', userId);
      round = currentRoundNumber();
      player = Players.findOne({userId: userId});
      username = getUsername(userId);
      if (!username || !player) {
        console.log('no player or username', username, player);
        return;
      }
      if (_.indexOf(player.rounds, round) === -1) {
        console.log('updating player round', player, round);
        player.rounds.push(round);
        player.currentRound = round;
        Players.update({userId: userId}, player);
        playerRound = addPlayerToPlayerRound(userId, round);
        addPlayerToRound(userId, username, playerRound.color);
        addMessage([
          username,
          'has joined round',
          round + '.',
        ].join(' '), 'join', userId);
      } else {
        console.log('not updating player round', player, round);
      }
      console.log('join done', Players.findOne());
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
      var username, regionObj, regionName, userId;
      if (_.isNull(this.userId)) {
        return;
      }
      userId = this.userId;
      if (!_.has(regionStore, region)) {
        return;
      }
      username = getUsername(userId);
      regionName = regionStore[region].name;
      combat.dropAttack(userId, region);
    }
  });
})();
