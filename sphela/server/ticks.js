
(function() {
  var TICK_INTERVAL,
    TICKS_IN_GAME,
    currentTick;
  /**
   * @type {number}
   * @const
   */
  TICK_INTERVAL = 10000;

  /**
   * @type {number}
   * @const
   */
//  TICKS_IN_GAME = 720;
  TICKS_IN_GAME = 10;

  /**
   * @type {number}
   */
  currentTick = 0;

  function runTick() {
    currentTick += 1;
    saveTick(currentTick);
    console.log('Tick!','tick:', currentTick, 'round:',
        currentRoundNumber());
    if (currentTick > TICKS_IN_GAME) {
      endGame();
      return;
    }
    updateTroopCounts();
  }

  function endGame() {
    currentTick = 0;
    startRound();
  }

  if (Meteor.isServer) {
    Meteor.startup(function() {
      startRound();
      Meteor.setInterval(runTick, TICK_INTERVAL);
    });
  }
})();
