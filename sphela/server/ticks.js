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
    console.log('adding tick message');
    addMessage(message);
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
      if (currentRoundNumber() === 0) {
        startRound();
      }
      Meteor.setInterval(runTick, global.TICK_INTERVAL);
    });
  }
})();
