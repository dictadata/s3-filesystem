/**
 * test/register
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const { logger } = require("@dictadata/storage-junctions/utils");

const S3FileSystem = require("../storage/filesystems/s3-filesystem");

logger.info("--- adding S3FileSystem to storage cortex");
storage.FileSystems.use("s3", S3FileSystem);
