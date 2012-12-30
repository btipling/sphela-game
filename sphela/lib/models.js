var global,
  Games,
  Rounds,
  Regions,
  Players,
  Updates;

global = this;

/**
 * Games is collection with only one item, the game state.
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
 * @param {Object} game
 */
function saveGame(game) {
  Games.update({_id: game._id}, game, global.NOOP);
}

/**
 * Rounds store information about the round, a round
 * is updated when it is active. Previous rounds serve
 * historical information needs.
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
 */
Players = new Meteor.Collection('players');

/**
 * @param {string} user The user id.
 * @return {Object} player
 */
function player(user) {
  var player, round;
  if (!_.isString(user)) {
    return;
  }
  player = Players.findOne({userId: user})
  if (!player) {
    player = {
      floatingTroops: 5,
      regions: [],
      userId: user,
      currentRound: 0
    };
    player._id = Players.insert(player);
  }
  return player;
}

/**
 * Iterate over all players and do something to them.
 * @param {Function} doSomething
 */
function forEachPlayer(doSomething) {
  var players;
  players = Players.find();
  players.forEach(doSomething);
}
if (Meteor.isServer) {
}

/**
 * @param {string} user
 * @param {Array.<string>} regions
 */
function setPlayerRegions(user, regions) {
}

/**
 * @param {string} user
 * @param {number} troops
 */
function setPlayerTotalTroops(user, troops) {
}

/**
 * @param {string} user
 * @param {number} troops
 */
function setPlayerFloatingTroops(user, troops) {
}

/**
 * @param {string} user
 * @return {Array.<string> regions
 */
function playerRegions(user) {
  return player(user).regions;
}

/**
 * @param {string} user
 * @return {number} troops
 */
function playerTotalTroops(user) {
}

/**
 * @param {string}
 * @return {Array.<string> troops
 */
function playerFloatingTroops(user) {
  return player(user).floatingTroops;
}


/**
 * Updates are messages that appear on the game site.
 * They are public announcements such as users joining,
 * territory wins, ticks etc.
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
  console.log('finished adding message');
}

