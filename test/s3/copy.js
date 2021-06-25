/**
 * test/S3/replicate
 */
"use strict";

require("../register");
const { logger } = require("@dictadata/storage-junctions/utils");
const { getFile, putFile } = require('@dictadata/storage-junctions/test');

logger.info("=== tests: S3 copy files");

async function test_1() {
  logger.info("=== download files from S3 folder");

  if (await getFile({
    origin: {
      smt: "*|s3:dictadata.org/data/test/|*.csv|*",
      options: {
        recursive: false
      }
    },
    terminal: {
      smt: "*|./data/output/s3/downloads/|*|*"
    }
  })) return 1;
}

async function test_2() {
  logger.info("=== upload files to S3 folder");

  if (await putFile({
    origin: {
      smt: "*|./data/test/|*.csv|*",
      options: {
        recursive: false
      }
    },
    terminal: {
      smt: "*|s3:dictadata.org/data/output/uploads/|*|*",
      options: {}
    }
  })) return 1;
}

async function test_3() {
  logger.info("=== upload shape files");

  if (await putFile({
    origin: {
      smt: "*|./data/shapefiles/United States/Iowa/|*.*|*",
      options: {
        recursive: true
      }
    },
    terminal: {
      smt: "*|s3:dictadata.org/shapefiles/United States/Iowa/|*|*",
      options: {
        useRPath: true
      }
    }
  })) return 1;
}

async function test_4() {
  logger.info("=== download shape files");

  if (await getFile({
    origin: {
      smt: "*|s3:dictadata.org/shapefiles/|*.*|*",
      options: {
        recursive: true
      }
    },
    terminal: {
      smt: "*|./data/output/s3/shapefiles/|*|*",
      options: {
        useRPath: true
      }
    }
  })) return 1;
}

(async () => {
  if (await test_1()) return 1;
  if (await test_2()) return 1;
  if (await test_3()) return 1;
  if (await test_4()) return 1;
})();
