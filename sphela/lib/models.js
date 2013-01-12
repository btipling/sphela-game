var global,
  Games,
  Rounds,
  Regions,
  Players,
  PlayerRounds,
  Updates, 
  MAX_MESSAGE_LENGTH;

global = this;

/**
 * @type {number}
 * @const
 */
MAX_MESSAGE_LENGTH = 256;

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
    game = {currentRound: 0, tick: 0};
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
  round = Rounds.findOne({round: round});
  if (!round) {
    game.currentRound = currentRound;
    game.tick = 0;
    saveGame(game);
    Rounds.insert({
      round: currentRound,
      regions: {},
      playerInfo: {}, // A map of userId to game info.
      numPlayers: [{count: 0, when: new Date().getTime()}]
    });
    addMessage('New round ' + currentRound + ' started!');
  }
}

/**
 * @return {Round}
 */
function currentRound() {
  var round;
  return Rounds.findOne({round:currentRoundNumber()});
}

/**
 * @param {string} userId
 * @param {string} name
 * @param {string} color
 */
function addPlayerToRound(userId, name, color) {
  var round, rounds;
  round = currentRound();
  if (_.has(round.playerInfo, userId)) {
    return;
  }
  round.numPlayers.push({
    count: _.last(round.numPlayers).count + 1,
    when: new Date().getTime()
  });
  round.playerInfo[userId] = {
    regions: [],
    name: name,
    color: color
  };
  Rounds.update({_id: round._id}, round);
}

/**
 * @param {number} round
 * @param {string} region
 */
function getRegion(round, region) {
  r = Rounds.findOne({round: round});
  regions = r.regions;
  if (!_.has(regions, region)) {
    return {
      owner: [],
      troopCount: []
    };
  }
  return regions[region];
}


/**
 * @param {string} userId
 * @param {number} round
 * @param {string} region
 */
function setRegionOwner(userId, round, region) {
  var regionObj, previousOwner, roundObj;
  regionObj = getRegion(round, region);
  previousOwner = _.last(regionObj.owner);
  if (previousOwner) {
    if (previousOwner.userId === userId) {
      return;
    }
    removeFromPlayerRegions(previousOwner.userId, round, region);
  }
  addToPlayerRegions(userId, round, region);
  regionObj.owner.push({
    userId: userId,
    when: new Date().getTime()
  });
  roundObj = currentRound();
  roundObj.regions[region] = regionObj;
  Rounds.update({_id: roundObj._id}, roundObj, global.NOOP);
}

/**
 * @param {number} round
 * @param {string} region
 * @param {number} troopCount
 */
function setRegionTroopCount(round, region, troopCount) {
  var regionObj, owner;
  regionObj = getRegion(round, region);
  regionObj.troopCount.push({
    count: troopCount,
    when: new Date().getTime()
  });
  roundObj = currentRound();
  roundObj.regions[region] = regionObj;
  Rounds.update({_id: roundObj._id}, roundObj, global.NOOP);
  owner = regionObj.owner;
  if (owner && !_.isEmpty(owner)) {
    updatePlayerTotalTroops(_.last(owner).userId, roundObj);
  }
}

/**
 * Get the userId for the owner of a region.
 * @param {number} round
 * @param {string} region
 * @return {string?} The user id or null if none.
 */
function regionOwner(round, region) {
  var regionObj;
  regionObj = getRegion(round, region);
  return _.last(regionObj.owner) || null;
}

/**
 * @param {number} round
 * @param {string} region
 * @return {number} number
 */
function regionTroopCount(round, region) {
  var regionObj;
  regionObj = getRegion(round, region);
  return _.last(regionObj.troopCount).count || 0;
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
function createPlayer(userId) {
  var player, round;
  if (!_.isString(userId)) {
    return;
  }
  player = Players.findOne({userId: userId})
  if (!player) {
    player = {
      signedUp: new Date().getTime(),
      userId: userId,
      rounds: [],
      currentRound: 0
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
 * @param {string=} opt_userId
 * @param {Date=} opt_when
 */
function addMessage(message, opt_type, opt_userId, opt_when) {
  var game, round, when;
  message = message.substr(0, MAX_MESSAGE_LENGTH);
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
    userId: opt_userId || null,
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
 * @return {Object} The player round.
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
      messages: [],
      color: getRandomColor(),
      regionCount: [{count: 0, time: new Date().getTime()}],
      regions: []
    };
    playerRound._id = PlayerRounds.insert(playerRound);
  }
  return playerRound;
}

/**
 * @return {string} A hexidecimal color.
 */
function getRandomColor() {
  var color, i;
  color = ['#'];
  for (i = 0; i < 6; i++ ) {
    color.push((Math.floor(Math.random() * 16)).toString(16));
  }
  return color.join('');
}

/**
 * @param {string} userId
 * @param {number} round
 * @param {string} message
 * @param {string=} opt_type
 */
function addPlayerRoundMessage(userId, round, message, opt_type) {
  var type, playerRound;
  playerRound = PlayerRounds.findOne({userId: userId, round: round});
  if (!playerRound) {
    return;
  }
  type = opt_type || 'info';
  playerRound.messages.push({
    message: message,
    type: type,
    when: new Date().getTime()
  });
  PlayerRounds.update({_id: playerRound._id}, playerRound, global.NOOP);
}

/**
 * @param {string} userId
 * @param {number|Object} round
 */
function updatePlayerTotalTroops(userId, round) {
  var round, total, playerRound;
  total =  0;
  if (!userId) {
    return;
  }
  if (_.isNumber(round)) {
    round = Rounds.findOne({round: round});
  }
  if (!_.has(round.playerInfo, userId)) {
    return;
  }
  _.each(round.playerInfo[userId].regions, function(region) {
    if (_.has(round.regions, region)) {
      total += _.last(round.regions[region].troopCount).count;
    }
  });
  playerRound = PlayerRounds.findOne({userId: userId, round: round.round});
  total += _.last(playerRound.floatingTroops).count;
  playerRound.totalTroops.push({count: total, time: new Date().getTime()});
  PlayerRounds.update({_id: playerRound._id}, playerRound, global.NOOP);
}

/**
 * @param {string} userId
 * @param {number} round
 * @param {number} troops
 */
function setPlayerFloatingTroops(userId, round, troops) {
  var playerRound;
  playerRound = PlayerRounds.findOne({userId: userId, round: round});
  if (!playerRound) {
    return;
  }
  playerRound.floatingTroops.push({count: troops, time: new Date().getTime()});
  PlayerRounds.update({_id: playerRound._id}, playerRound, global.NOOP);
}

/**
 * @param {string} userId
 * @param {string} round
 * @param {string} region
 */
function addToPlayerRegions(userId, round, region) {
  var playerRound, round_, region;
  playerRound = PlayerRounds.findOne({userId: userId, round: round});
  if (!playerRound) {
    return;
  }
  playerRound.regions = _.uniq([region].concat(playerRound.regions));
  playerRound.regionCount.push({
    count: playerRound.regions.length,
    when: new Date().getTime()
  });
  PlayerRounds.update({_id: playerRound._id}, playerRound, global.NOOP);
  round_ = currentRound();
  regions = round_.playerInfo[userId].regions;
  if (_.indexOf(regions, region) === -1) {
    round_.playerInfo[userId].regions.push(region);
    Rounds.update({_id: round_._id}, round_, global.NOOP);
  }
};

/**
 * @param {string} userId
 * @param {string} round
 * @param {string} region
 */
function removeFromPlayerRegions(userId, round, region) {
  var playerRound, round_, regions;
  playerRound = PlayerRounds.findOne({userId: userId, round: round});
  if (!playerRound) {
    return;
  }
  playerRound.regions = _.without(playerRound.regions, region);
  playerRound.regionCount.push({
    count: playerRound.regions.length,
    when: new Date().getTime()
  });
  PlayerRounds.update({_id: playerRound._id}, playerRound, global.NOOP);
  round_ = currentRound();
  regions = round_.playerInfo[userId].regions;
  round_.playerInfo[userId].regions = _.without(regions, region);
  Rounds.update({_id: round_._id}, round_, global.NOOP);
};

/**
 * @param {string} userId
 * @param {number} round
 * @return {Array.<string>} regions
 */
function playerRegions(userId, round) {
  var playerRound;
  playerRound = PlayerRounds.findOne({userId: userId, round: round});
  if (!playerRound) {
    return [];
  }
  return playerRound.regions;
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

