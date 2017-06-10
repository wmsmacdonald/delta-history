# delta-history
Keeps version history of file buffers for getting the vcdiff delta between a version and the latest

# API
### createDeltaHistory([options])
* `options` Object
  * `deltaToFileRatio` Number
  * `maxDiscSize` Number
  * `storageDirectory` String
 
Returns an instance of `DeltaHistory`.

### options.deltaToFileRatio = 10 (NOT IMPLEMENTED, only stores files)
Range: all integers > 0

Ratio of delta intermediaries to full files. Increasing this will reduce storage size at the cost of more CPU calculation.

### options.maxDiscStorageSize = 128000000 (128 MB) (NOT IMPLEMENTED)
Range: all integers > 0

Maximum size in bytes to store recent file versions on disc. If this is reached, it will start deleting earlier files. If a single file is too large to fit,  `DeltaHistory.OversizedFileError` will be thrown.

### options.storageDirectory (NOT IMPLEMENTED)
Directory that stores persistant file version data. If this is not specified, the version store will be cleared when the package starts again.

## Class: DeltaHistory
### deltaHistory.addVersion(fileId, [file])
`fileId` String
`file` Buffer = `new Buffer([])`

Returns String `versionId`that identifies the version for this particular file.

### deltaHistory.hasFile(fileId)
`fileId` String

Returns true if there is at least one version for the given file, otherwise false.

### deltaHistory.hasVersion(fileId, versionId)
`fileId` String
`versionId` String

Returns true if the given version exists for the given file, otherwise false.

### deltaHistory.getDelta(fileId, versionId)
`fileId` String
`versionId` String

Returns Buffer vcdiff encoded delta with from the version given by versionId to the last file added. If the version isn't in storage (either never added or it was evicted), it returns `null`.

### deltaHistory.getLastestVersion(fileId)
`fileId` String
Returns Buffer of last file added to the file history given by fileId. If there was no last version, it returns `null`.

### deltaHistory.reset()
Deletes all stored files.
