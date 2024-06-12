/**
 * test/register
 */
"use strict";

const { Storage } = require("@dictadata/storage-junctions");
const { logger } = require("@dictadata/lib");

const S3FileSystem = require("../storage/filesystems/s3-filesystem");

logger.info("--- adding S3FileSystem to storage cortex");
Storage.FileSystems.use("s3", S3FileSystem);
