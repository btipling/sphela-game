var global = this;
  var Games,
    models,
    Rounds,
    Regions,
    Players;
  Games = new Meteor.Collection('games');

  /**
   * @type {Object}
   */
  models = {};

  /**
   * @return {Object}
   */
  function getGame() {
    var game;
    game = Games.findOne();
    if (!game) {
      game = {currentRound: 1};
      game._id = Games.insert(game);
    }
    return game;
  }
  models.getGame = getGame;

  /**
   * @return {number}
   */
  function currentRound() {
    var rounds;
    rounds = Rounds.find({});
    return getGame().currentRound;
  }
  models.currentRound = currentRound;

  /**
   * @param {Object} game
   */
  function saveGame(game) {
    Games.update({_id: game._id}, game, global.NOOP);
  }
  models.saveGame = saveGame;

  Rounds = new Meteor.Collection('rounds');

  function startRound() {
    console.log('start round');
    var game, currentRound, round;
    game = getGame();
    currentRound = game.currentRound;
    if (!_.isNumber(currentRound)) {
      currentRound = 0;
    }
    currentRound++;
    game.currentRound = currentRound;
    saveGame(game);
    Rounds.insert({
      round: currentRound,
      numPlayers: 0
    });
    rounds = Rounds.find({});
    var foundIt = false;
  }
  models.startRound = startRound;

  function addPlayerToRound() {
    var round, rounds;
    rounds = Rounds.find({});
    round = Rounds.findOne({round: currentRound()});
    rounds = Rounds.find();
    rounds.numPlayers += 1;
    Rounds.update({_id: round._id}, rounds, global.NOOP);
  }
  models.addPlayerToRound = addPlayerToRound;


  Regions = new Meteor.Collection('regions');

  /**
   * @param {string} regionId
   * @param {string} user
   */
  function setRegionOwner(regionId, user) {
  }
  models.setRegionOwner = setRegionOwner;

  /**
   * @param {string} regionId
   * @param {number} troopCount
   */
  function setRegionTroopCount(regionId, troopCount) {
  }
  models.setRegionTroopCount = setRegionTroopCount;

  /**
   * @param {string} regionId
   * @return {string} user
   */
  function regionOwner(regionId) {
  }
  models.regionOwner = regionOwner;

  /**
   * @param {string} regionId
   * @return {number} number
   */
  function regionTroopCount(regionId) {
  }
  models.regionTroopCount = regionTroopCount;

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
    player = Players.findOne({userid: user})
    if (!player) {
      player = {
        floatingTroops: 5,
        regions: [],
        userid: user,
        currentRound: 0
      };
      player._id = Players.insert(player);
    }
    round  = currentRound();
    if (player.currentRound !== round) {
      addPlayerToRound();
      player.currentRound = round;
      Players.update({_id: player._id}, player, global.NOOP);
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
    models.forEachPlayer = forEachPlayer;
  }

  /**
   * @param {string} user
   * @param {Array.<string>} regions
   */
  function setPlayerRegions(user, regions) {
  }
  models.setPlayerRegions = setPlayerRegions;

  /**
   * @param {string} user
   * @param {number} troops
   */
  function setPlayerTotalTroops(user, troops) {
  }
  models.setPlayerTotalTroops = setPlayerTotalTroops;

  /**
   * @param {string} user
   * @param {number} troops
   */
  function setPlayerFloatingTroops(user, troops) {
  }
  models.setPlayerFloatingTroops = setPlayerFloatingTroops();

  /**
   * @param {string} user
   * @return {Array.<string> regions
   */
  function playerRegions(user) {
    return player(user).regions;
  }
  models.playerRegions = playerRegions;

  /**
   * @param {string} user
   * @return {number} troops
   */
  function playerTotalTroops(user) {
  }
  models.playerTotalTroops = playerTotalTroops;

  /**
   * @param {string}
   * @return {Array.<string> troops
   */
  function playerFloatingTroops(user) {
    return player(user).floatingTroops;
  }
  models.playerFloatingTroops = playerFloatingTroops;

  global.models = models;
