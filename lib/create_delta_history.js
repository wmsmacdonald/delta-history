'use strict';

const DeltaHistory = require('./delta_history');

function createDeltaHistory(options) {
  return new DeltaHistory(options);
}

module.exports = createDeltaHistory;