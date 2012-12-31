var global,
  Games,
  Rounds,
  Regions,
  Players,
  PlayerRounds,
  Updates;

global = this;

/**
 * Games is collection with only one item, the game state.
 * @type {Meteor.Collection}
 */
Games = new Meteor.Collection('games');

/**
 * @type {Object}
 */

/**
 * Increments or updates tick.
 * @param {number=} opt_tick
 */
function saveTick(opt_tick) {
  var game;
  game = getGame();
  if (_.isNumber(opt_tick)) {
    game.tick = opt_tick;
  } else {
    game.tick = game.tick += 1;
  }
  saveGame(game);
}

/**
 * @return {Object}
 */
function getGame() {
  var game;
  game = Games.findOne();
  if (!game) {
    game = {currentRound: 1, tick: 0};
    game._id = Games.insert(game);
  }
  return game;
}

/**
 * @return {number}
 */
function currentRoundNumber() {
  var rounds;
  return getGame().currentRound;
}

/**
 * Doesn't create a game if it doesn't exist.
 * @return {number}
 */
function clientCurrentRoundNumber() {
  var game;
  game = Games.findOne();
  if (!game) {
    return 0;
  }
  return game.currentRound;
}

/**
 * @param {Object} game
 */
function saveGame(game) {
  Games.update({_id: game._id}, game, global.NOOP);
}

/**
 * Rounds store information about the round, a round
 * is updated when it is active. Previous rounds serve
 * historical information needs.
 * @type {Meteor.Collection}
 */
Rounds = new Meteor.Collection('rounds');

function startRound() {
  var game, currentRound, round;
  game = getGame();
  currentRound = game.currentRound;
  if (!_.isNumber(currentRound)) {
    currentRound = 0;
  }
  currentRound++;
  game.currentRound = currentRound;
  game.tick = 0;
  saveGame(game);
  Rounds.insert({
    round: currentRound,
    numPlayers: 0
  });
  rounds = Rounds.find({});
  addMessage('New round ' + currentRound + ' started!');
}

/**
 * @return {Round}
 */
function currentRound() {
  var round;
  return Rounds.findOne({round:currentRoundNumber()});
}

function addPlayerToRound() {
  var round, rounds;
  round = Rounds.findOne({round: currentRoundNumber()});
  round.numPlayers += 1;
  Rounds.update({_id: round._id}, round);
}


/**
 * Regions store information about existing region states.
 * @type {Meteor.Collection}
 */
Regions = new Meteor.Collection('regions');

/**
 * @param {string} regionId
 * @param {string} user
 */
function setRegionOwner(regionId, user) {
}

/**
 * @param {string} regionId
 * @param {number} troopCount
 */
function setRegionTroopCount(regionId, troopCount) {
}

/**
 * @param {string} regionId
 * @return {string} user
 */
function regionOwner(regionId) {
}

/**
 * @param {string} regionId
 * @return {number} number
 */
function regionTroopCount(regionId) {
}

/**
 * Players store additional game information for users.
 * @type {Meteor.Collection}
 */
Players = new Meteor.Collection('players');

/**
 * @param {string} userId The user id.
 * @return {Object} player
 */
function player(userId) {
  var player, round;
  if (!_.isString(userId)) {
    return;
  }
  player = Players.findOne({userId: userId})
  if (!player) {
    player = {
      signedUp: new Date().getTime(),
      userId: userId,
      rounds: []
    };
    player._id = Players.insert(player);
  }
  return player;
}

/**
 * Updates are messages that appear on the game site.
 * They are public announcements such as users joining,
 * territory wins, ticks etc.
 * @type {Meteor.Collection}
 */
Updates = new Meteor.Collection('updates');

/**
 * @param {string} message
 * @param {string=} opt_type
 * @param {Date=} opt_when
 */
function addMessage(message, opt_type, opt_when) {
  var game, round, when;
  console.log('message', message);
  game = Games.findOne();
  if (!game) {
    round = 0;
  } else {
    round = game.currentRound;
  }
  when = opt_when ? opt_when.getTime() : (new Date()).getTime();
  Updates.insert({
    message: message,
    type: opt_type || 'info',
    round: round,
    when: when,
  }, global.NOOP);
}

/**
 * Player information for a round.
 * @type {Array.<Meteor.Collection>}
 */
PlayerRounds = new Meteor.Collection('playerRounds');

/**
 * Initialize a user's player round.
 * @param {string} userId
 * @param {number} round
 */
function addPlayerToPlayerRound(userId, round) {
  var playerRound, initialCount;
  playerRound = PlayerRounds.findOne({userId: userId, round: round});
  initialCount = {count: 5, time: new Date().getTime()};
  if (!playerRound) {
    playerRound = {
      round: round,
      userId: userId,
      totalTroops: [initialCount],
      floatingTroops: [initialCount],
      regionCount: [{count: 0, time: new Date().getTime()}],
      regions: []
    };
    playerRound._id = PlayerRounds.insert(playerRound);
  }
  return playerRound;
}

/**
 * @param {string} userId
 * @param {number} round
 * @param {Array.<string>} regions
 */
function setPlayerRegions(userId, round, regions) {
}

/**
 * @param {string} userId
 * @param {number} round
 * @param {number} troops
 */
function setPlayerTotalTroops(userId, round, troops) {
}

/**
 * @param {string} userId
 * @param {number} round
 * @param {number} troops
 */
function setPlayerFloatingTroops(userId, round, troops) {
}

/**
 * @param {string} userId
 * @param {number} round
 * @return {Array.<string> regions
 */
function playerRegions(userId, round) {
  return 0;
}

/**
 * @param {string} userId
 * @param {number} round
 * @return {number} troops
 */
function playerTotalTroops(userId, round) {
}

/**
 * @param {string} userId
 * @param {number} round
 * @return {Array.<string> troops
 */
function playerFloatingTroops(userId, round) {
  var playerRound, playerRound;
  playerRound = PlayerRounds.findOne({userId: userId, round: round});
  if (!playerRound) {
    return 0;
  }
  return _.last(playerRound.floatingTroops).count;
}

