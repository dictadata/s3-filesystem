# s3-filesystem 1.2.x

S3 filesystem plugin for @dictadata/storage-junctions.

## Installation

```bash
npm i @dictadata/storage-junctions
npm i @dictadata/s3-filesystem
```

## Registering the Plugin

```javascript
const { Storage } = require("@dictadata/storage-junctions");
const S3FileSystem = require("@dictadata/s3-filesystem");

Storage.FileSystems.use("s3", S3FileSystem);
```

## Usage in SMT Identifiers

Example SMT string for accessing json files in an S3 bucket.

```javascript
let smt = "json|s3:dictadata/test/data/|foofile.json|*"
```

Where:

- "json" - ***smt model*** of junction used to encode and query data in the storage source.
- "s3:dictadata/test/data/" - ***smt locus*** locator address for the storage source.
  - "s3" - ***filesystem model*** used to access data containers in the storage source.
  - "dictadata.org" - *S3 bucket* name.
  - "/data/" - *S3 prefix* for object names.
- "foo_*" - ***smt schema*** specification for *S3 object names* with wildcard.
- "*" - ***smt key*** \* represents all constructs.

## Support Junction Methods

Storage FileSystems support the following methods.

- list()
- createReadStream()
- createWriteStream()
- getFile()
- putFile()
- dull()
