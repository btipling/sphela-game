var global = this;
(function() {
  var  currentTick;


  /**
   * @type {number}
   */
  currentTick = 0;

  function runTick() {
    var message;
    currentTick += 1;
    saveTick(currentTick);
    message = [
      'Tick!', 'tick:', currentTick, 'round:', currentRoundNumber()].join(' ');
    addMessage(message);
    if (currentTick > TICKS_IN_GAME) {
      endGame();
      return;
    }
    updateCredits();
    updateTopStats();
  }

  function endGame() {
    currentTick = 0;
    startRound();
  }

  if (Meteor.isServer) {
    Meteor.startup(function() {
      var r, g;
      r = currentRoundNumber();
      if (!r || r === 0) {
        startRound();
      }
      g = getGame();
      if (g) {
        currentTick = g.tick;
      }
      Meteor.setInterval(runTick, global.TICK_INTERVAL);
    });
  }
})();
