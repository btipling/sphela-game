
(function () {
  function updateTroopCounts() {
    console.log('updating troop counts!');
    global.models.forEachPlayer(function(player) {
      //For each region owned add troops.
        //For a region owned:
          // Increment troops with min region num.
          // Add 1 for each vector for region owned.
          // Add 2 for each vector if all are owned.
      //If no regions and no existing troops set min floating troops.
    });
  }
  global.updateTroopCounts = updateTroopCounts;
})();
