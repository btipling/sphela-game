
var sessionKeys = (function() {
  /*
   * @enum {*}
   * @const
   */
  return {
    /**
     * Key for checking if info is ready.
     */
    CONNECTED: 'connected',
    /**
     * Key for setting region in session.
     * @type {string}
     */
    SELECTED_REGION: 'selectedRegion',
    /**
     * Key for all regions.
     * @type {Array.<Object>}
     */
    ALL_REGIONS: 'allRegions',
    /**
     * Key for set region.
     * @type {string}
     */
    SET_REGION: 'setRegion',
    /**
     * Key for current round.
     * @type {string}
     */
    CURRENT_ROUND: 'currentRound',
    /**
     * Key for selected target.
     */
    SELECTED_TARGET: 'selectedTarget',
    /**
     * Key for region for which info is requested.
     */
    REQUESTED_REGION: 'requestedRegion'
  };
})();
