/**
 * @fileOverview The methods a client can call.
 */
Meteor.methods({
  /**
   * When a user joins the round the client calls this method.
   * @param {string} userId The user's id.
   */
  joinRound: function(userId) {
    var player, playerRound, round, user;
    round = currentRoundNumber();
    player = Players.findOne({userId: userId});
    user = Meteor.users.findOne({_id: userId});
    if (!user) {
      return;
    }
    if (_.indexOf(player.rounds, round) === -1) {
      player.rounds.push(round);
      Players.update({userId: userId}, player, global.NOOP);
      addPlayerToPlayerRound(userId, round);
      addPlayerToRound();
      addMessage([
        user.profile.name,
        'has joined round',
        round + '!',
      ].join(' '));
    }
  },
  /**
   * User adds a chat message to updates.
   * @param {string} userId
   * @param {string} message
   */
  say: function(userId, message) {
    var user;
    user = Meteor.users.findOne({_id: userId});
    if (!user || message.length === 0) {
      return;
    }
    addMessage([
      user.profile.name,
      ': ',
      message
    ].join(''), 'chat');
  }
});
