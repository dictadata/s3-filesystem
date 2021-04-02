/**
 * test/transportdb-junction
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const logger = storage.utils.logger;

const S3FileSystem = require("../storage/filesystems/s3-filesystem");

logger.info("--- adding S3FileSystem to storage cortex");
storage.FileSystems.use("s3", S3FileSystem);
