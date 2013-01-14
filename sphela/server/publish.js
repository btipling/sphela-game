/**
 * @fileOverview The information the server publishes to the client.
 */

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
 * Publish top stats.
 */
Meteor.publish('topstats', function() {
  var handle, self;
  handle = TopStats.find({}).observe({
    changed: _.bind(function(t) {
      this.set('topstats', t._id, t);
      this.flush();
    }, this),
    added: _.bind(function(t) {
      this.set('topstats', t._id, t);
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
      this.set('rounds', r._id, r);
      this.flush();
    }, this),
    added: _.bind(function(r) {
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
 * @param {string} userId,
 * @param {number} round
 */
Meteor.publish('players', function(userId, round) {
  var handle, self;
  if (_.isNull(this.userId) || userId !== this.userId) {
    return;
  }
  handle = Players.find({userId: userId, currentRound: round}).observe({
    changed: _.bind(function(player) {
      this.set('players', player._id, player);
      this.flush();
    }, this),
    added: _.bind(function(player) {
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
