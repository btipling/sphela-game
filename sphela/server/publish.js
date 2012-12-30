/**
 * @fileOverview The information the server publishes to the client.
 */

/**
 * Publish information when first connected.
 */
Meteor.publish('connect', function(userId) {
  var uuid;
  uuid = Meteor.uuid();
  this.set('games', uuid, getGame());
  this.set('rounds', uuid, currentRound());
  this.set('players', uuid, player(userId));
  this.complete();
  this.flush();
});

/**
 * Publish information when game updates.
 */
Meteor.publish('tick', function() {
  var uuid, handle, self;
  uuid = Meteor.uuid();
  handle = Games.find({}).observe({
    changed: _.bind(function() {
      this.set('games', uuid, getGame());
      this.flush();
    }, this),
    added: _.bind(function() {
      this.set('games', uuid, getGame());
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
  var uuid, handle, self;
  uuid = Meteor.uuid();
  handle = Rounds.find({}).observe({
    changed: _.bind(function() {
      this.set('rounds', uuid, currentRound());
      this.flush();
    }, this),
    added: _.bind(function() {
      this.set('rounds', uuid, currentRound());
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
 * @param {string} user The user's id.
 */
Meteor.publish('player', function(user) {
  var uuid, handle, self;
  uuid = Meteor.uuid();
  handle = Players.find({userId: user}).observe({
    changed: _.bind(function(player) {
      this.set('players', uuid, player);
      this.flush();
    }, this),
    added: _.bind(function(player) {
      this.set('players', uuid, player);
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
  var uuid, handle, self;
  if (_.isNull(round)) {
    return;
  }
  uuid = Meteor.uuid();
  console.log('update sub', round);
  handle = Updates.find({round: round}).observe({
    changed: _.bind(function(update) {
      console.log('update changed');
      this.set('updates', uuid, update);
      this.flush();
    }, this),
    added: _.bind(function(update) {
      console.log('update added');
      this.set('updates', uuid, update);
      this.flush();
    }, this)
  });
  this.complete();
  this.flush();
  this.onStop(function() {
    handle.stop();
  });
});
