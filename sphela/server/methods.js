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
     * @param {string} userId The user's id.
     */
    joinRound: function(userId) {
      var player, playerRound, round, username;
      round = currentRoundNumber();
      player = Players.findOne({userId: userId});
      username = getUsername(userId);
      if (!username) {
        return;
      }
      if (_.indexOf(player.rounds, round) === -1) {
        player.rounds.push(round);
        Players.update({userId: userId}, player, global.NOOP);
        addPlayerToPlayerRound(userId, round);
        addPlayerToRound();
        addMessage([
          username,
          'has joined round',
          round + '.',
        ].join(' '));
      }
    },
    /**
     * User adds a chat message to updates.
     * @param {string} userId
     * @param {string} message
     */
    say: function(userId, message) {
      var username;
      username = getUsername(userId);
      if (!username || message.length === 0) {
        return;
      }
      addMessage([
        username,
        ': ',
        message
      ].join(''), 'chat');
    },
    /**
     * Drop attack on a region.
     * @param {string} userId
     * @param {string} region
     */
    dropAttack: function(userId, region) {
      var username, regionObj, regionName;
      username = getUsername(userId);
      regionName = regionStore[region].name;
      addMessage([
          username,
          'has dropped on',
          regionName + '.'
      ].join(' '), 'attack');
    }
  });
})();
