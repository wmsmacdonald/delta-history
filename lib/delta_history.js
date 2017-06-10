'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const childProcess = require('child_process');

const vcd = require('vcdiff');
const json = require('json-file');
const tmp = require('tmp');

const errors = require('./errors')

tmp.setGracefulCleanup();

function DeltaHistory(options) {
  let defaultOptions = {
    maxDiscStorageSize: 1280000000
  };

  options = typeof options === 'object'
    ? options
    : defaultOptions;

  this.maxDiscStorageSize = options.maxDiscStorageSize;

  let { name: tempFolder, removeCallback: tempFileRemove } =
    tmp.dirSync({ prefix: 'deltaHistory_', unsafeCleanup: true });
  this.rootFolder = tempFolder;

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
  if (!this.hasFile(fileId)) {
    let folder = checksum(fileId);

    fs.mkdirSync(path.join(
      this.rootFolder,
      'data',
      folder
    ));

    this.files[fileId] = {
      folder: folder,
      latest: versionId,
      versions: {}
    };
  }

  // file version doesn't yet exist
  if (!this.hasVersion(fileId, versionId)) {
    fs.writeFileSync(path.join(
      this.rootFolder,
      'data',
      this.files[fileId].folder,
      versionId
    ), fileBuffer);
    this.files[fileId].versions[versionId] = true;
  }
  this.files[fileId].latest = versionId;
  this.indexFile.set('files', this.files);
  this.indexFile.writeSync();

  return versionId;
};

DeltaHistory.prototype.getLatestVersion = function(fileId) {
  this._validateFile(fileId)

  const file = path.join(
    this.rootFolder,
    'data',
    this.files[fileId].folder,
    this.files[fileId].latest
  )

  return fs.readFileSync(file);
};

DeltaHistory.prototype.hasFile = function(fileId) {
  return this.files[fileId] !== undefined
}

DeltaHistory.prototype._validateFile = function(fileId) {
  if (!this.hasFile(fileId)) {
    throw errors.FileDoesNotExist
  }
}

DeltaHistory.prototype.hasVersion = function(fileId, versionId) {
  this._validateFile(fileId)
  return this.files[fileId].versions[versionId] !== undefined
}

DeltaHistory.prototype._validateVersion = function(fileId, versionId) {
  if (!this.hasVersion(fileId, versionId)) {
    throw new Error('Version must exist')
  }
}

DeltaHistory.prototype.getDelta = function(fileId, versionId) {
  this._validateVersion(fileId, versionId)

  let source = fs.readFileSync(path.join(this.rootFolder, 'data',  this.files[fileId].folder, versionId));
  let target = this.getLatestVersion(fileId);

  return vcd.vcdiffEncodeSync(
    target,
    { hashedDictionary: new vcd.HashedDictionary(source) }
  );
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