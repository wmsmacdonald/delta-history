# delta-history
Keeps version history of file buffers for getting the vcdiff delta between a version and the latest

# API
### createDeltaHistory([options])
* `options` Object
  * `deltaToFileRatio` Number
  * `maxDiscSize` Number
 
Returns an instance of `DeltaHistory`.

### options.deltaToFileRatio = 100
Range: all numbers > 0

Ratio of delta intermediaries to full files. Increasing this will reduce storage size at the cost of more CPU calculation.

### options.maxDiscStorageSize = 128000000 (128 MB)
Range: all integers > 0

Maximum size in bytes to store recent file versions on disc. If this is reached, it will start deleting earlier files. If a single file is too large to fit,  `DeltaHistory.OversizedFileError` will be thrown.

## Class: DeltaHistory
### deltaHistory.addVersion(fileId, [file])
`fileId` String
`file` Buffer = `new Buffer([])`

Returns String `versionId`that identifies the version for this particular file.

### deltaHistory.getDelta(fileId, versionId)
`fileId` String
`versionId` String

Returns Buffer vcdiff encoded delta with from the version given by versionId to the last file added.

### deltaHistory.getLast(fileId)
`fileId` String
Returns Buffer of last file added to the file history given by fileId.
