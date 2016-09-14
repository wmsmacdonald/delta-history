'use strict';

function DeltaHistory(options) {
  let defaultOptions = {
    deltaToFileRatio: 100,
    maxDiscStorageSize: 1280000000
  };

  options = typeof options === 'object'
    ? options
    : defaultOptions;


}

DeltaHistory.prototype.addVersion = function(fileId, file) {

};

module.exports = DeltaHistory;