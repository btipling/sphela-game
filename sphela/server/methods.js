/**
 * @fileOverview The methods a client can call.
 */
Meteor.methods({
  /**
   * When a user joins the round the client calls this method.
   * @param {string} user The user's id.
   */
  joinRound: function(user) {
    var player, round;
    round = currentRound();
    player = Players.findOne({userId: user});
    if (player.currentRound !== round.round) {
      player.currentRound = round.round;
      Players.update({userId: user}, player, global.NOOP);
      addPlayerToRound();
    }
  }
});
