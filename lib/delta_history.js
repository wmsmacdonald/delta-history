'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const childProcess = require('child_process');

const vcd = require('vcdiff');
const json = require('json-file');
const tmp = require('tmp');

tmp.setGracefulCleanup();

function DeltaHistory(options) {
  let defaultOptions = {
    maxDiscStorageSize: 1280000000
  };

  options = typeof options === 'object'
    ? options
    : defaultOptions;

  this.maxDiscStorageSize = options.maxDiscStorageSize;


  let { name: tempFolder, removeCallback: tempFileRemove } = tmp.dirSync({ prefix: 'deltaHistory_', unsafeCleanup: true });
  this.rootFolder = tempFolder;
  this.tempFileRemove = tempFileRemove;

  let indexPath = path.join(tempFolder, 'index.json');

  try {
    this.indexFile = json.read(indexPath);
  }
  catch (e) {
    if (e.code === 'ENOENT') {
      fs.writeFileSync(indexPath, '{ "files": {} }');
      fs.mkdirSync(path.join(tempFolder, 'data'));
      this.indexFile = json.read(indexPath);
    }
    else throw e;
  }

  this.files = this.indexFile.get('files');
}

DeltaHistory.prototype.addVersion = function(fileId, fileBuffer) {

  let versionId = checksum(fileBuffer);

  // entry for file doesn't exist
  if (this.files[fileId] === undefined) {
    let fileFolder = path.join(this.rootFolder, 'data', fileId);
    fs.mkdirSync(fileFolder);

    this.files[fileId] = {
      latest: versionId,
      versions: {}
    };
  }

  // file version doesn't yet exist
  if (this.files[fileId].versions[versionId] === undefined) {
    fs.writeFileSync(path.join(this.rootFolder, 'data', fileId, versionId), fileBuffer);
    this.files[fileId].versions[versionId] = true;
  }
  this.files[fileId].latest = versionId;
  this.indexFile.set('files', this.files);
  this.indexFile.writeSync();

  return versionId;
};

DeltaHistory.prototype.getLatestVersion = function(fileId) {
  if (this.files[fileId] === undefined) {
    return null;
  }

  let latestBuffer = fs.readFileSync(path.join(this.rootFolder, 'data', fileId, this.files[fileId].latest));
  return latestBuffer;
};

DeltaHistory.prototype.getDelta = function(fileId, versionId) {
  if (this.files[fileId] === undefined) {
    return null;
  }

  let source = fs.readFileSync(path.join(this.rootFolder, 'data', fileId, versionId));
  let target = this.getLatestVersion(fileId);

  let delta = vcd.vcdiffEncodeSync(target, { hashedDictionary: new vcd.HashedDictionary(source) });
  return delta;
};

DeltaHistory.prototype.reset = function() {
  this.files = {};
  this.indexFile.set('files', this.files);
  this.indexFile.writeSync();
  childProcess.execSync('rm -rf ' + path.join(this.rootFolder, 'data'));
  fs.mkdirSync(path.join(this.rootFolder, 'data'));
};

function checksum(data) {
  return crypto.createHash('sha1').update(data).digest('hex');
}


module.exports = DeltaHistory;