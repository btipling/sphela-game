/**
 * @fileOverview The information the server publishes to the client.
 */

/**
 * Publish information when first connected.
 */
Meteor.publish('connect', function() {
  var game, round, player_;
  userId = this.userId;
  game = getGame();
  round = currentRound();
  this.set('games', game._id, game);
  this.set('rounds', round._id, round);
  if (!_.isNull(userId)) {
    player_ = player(userId);
    this.set('players', player_._id, player_);
  }
  this.complete();
  this.flush();
});
/**
 * Subscribed to and published when a user joins a round.
 */
Meteor.publish('join', function(round) {
  var userId;
  userId = this.userId;
  console.log('returning a player');
  if (_.isNull(userId)) {
    return;
  }
  console.log('yup');
  return Players.find({userId: userId});
});

/**
 * Publish information when game updates.
 */
Meteor.publish('tick', function() {
  var handle, self;
  handle = Games.find({}).observe({
    changed: _.bind(function(game) {
      var game;
      game = getGame();
      this.set('games', game._id, game);
      this.flush();
    }, this),
    added: _.bind(function() {
      var game;
      game = getGame();
      this.set('games', game._id, game);
      this.flush();
    }, this)
  });
  this.complete();
  this.flush();
  this.onStop(function() {
    handle.stop();
  });
});

/**
 * Publish round updates.
 */
Meteor.publish('round', function() {
  var handle, self;
  handle = Rounds.find({}).observe({
    changed: _.bind(function(r) {
      console.log('rounds changed');
      this.set('rounds', r._id, r);
      this.flush();
    }, this),
    added: _.bind(function(r) {
      console.log('rounds added');
      this.set('rounds', r._id, r);
      this.flush();
    }, this)
  });
  this.complete();
  this.flush();
  this.onStop(function() {
    handle.stop();
  });
});

/**
 * Publish player updates.
 */
Meteor.publish('player-game', function(round) {
  var handle, self, userId;
  userId = this.userId;
  if (_.isNull(userId)) {
    return;
  }
  handle = Players.find({userId: userId, currentRound: round}).observe({
    changed: _.bind(function(player) {
      console.log('player changed?', userId);
      console.log('\n\n', player._id, player.rounds, '\n\n');
      this.set('players', player._id, player);
      this.flush();
    }, this),
    added: _.bind(function(player) {
      console.log('player added?');
      this.set('players', player._id, player);
      this.flush();
    }, this)
  });
  this.complete();
  this.flush();
  this.onStop(function() {
    handle.stop();
  });
});

/**
 * Publish recent announcements and upates.
 */
Meteor.publish('recent-updates', function() {
  return Updates.find({}, {sort: {when: -1}, limit: 20});
});

/**
 * Publish announcements and updates as they happen.
 * @param {number} round
 */
Meteor.publish('round-updates', function(round) {
  var handle, self;
  if (_.isNull(round)) {
    return;
  }
  handle = Updates.find({round: round}).observe({
    added: _.bind(function(update) {
      this.set('updates', update._id, update);
      this.flush();
    }, this)
  });
  this.complete();
  this.flush();
  this.onStop(function() {
    handle.stop();
  });
});

/**
 * Publish player round information.
 * @param {string} userId
 * @param {number} round
 */
Meteor.publish('player-round-updates', function(round) {
  var handle, self, userId;
  userId = this.userId;
  if (!userId || !round) {
    return;
  }
  handle = PlayerRounds.find({userId: userId, round: round}).observe({
    changed: _.bind(function(round) {
      this.set('playerRounds', round._id, round);
      this.flush();
    }, this),
    added: _.bind(function(round) {
      this.set('playerRounds', round._id, round);
      this.flush();
    }, this)
  });
  this.complete();
  this.flush();
  this.onStop(function() {
    handle.stop();
  });
});
