/**
 * test/S3/replicate
 */
"use strict";

require("../register");
const { logger } = require("@dictadata/storage-junctions/utils");
const { getFiles, putFiles } = require('@dictadata/storage-junctions/test');

logger.info("=== tests: S3 copy files");

async function test_1() {
  logger.info("=== download files from S3 folder");

  if (await getFiles({
    origin: {
      smt: "*|s3:dictadata/test/data/input/|*.json|*",
      options: {
        recursive: false
      }
    },
    terminal: {
      smt: "*|./test/data/output/s3/downloads/|*|*"
    }
  })) return 1;
}

async function test_2() {
  logger.info("=== upload files to S3 folder");

  if (await putFiles({
    origin: {
      smt: "*|./test/data/input/|*.json|*",
      options: {
        recursive: false
      }
    },
    terminal: {
      smt: "*|s3:dictadata/test/output/uploads/|*|*",
      options: {}
    }
  })) return 1;
}

async function test_3() {
  logger.info("=== upload shape files");

  if (await putFiles({
    origin: {
      smt: "*|/var/dictadata/US/IA/sos.iowa.gov/shapefiles/City Precincts/|A*.*|*",
      options: {
        recursive: true
      }
    },
    terminal: {
      smt: "*|s3:dictadata/US/IA/sos.iowa.gov/shapefiles/City Precincts/|*|*",
      options: {
        useRPath: true
      }
    }
  })) return 1;
}

async function test_4() {
  logger.info("=== download shape files");

  if (await getFiles({
    origin: {
      smt: "*|s3:dictadata/US/IA/sos.iowa.gov/shapefiles/City Precincts/|A*.*|*",
      options: {
        recursive: true
      }
    },
    terminal: {
      smt: "*|./test/data/output/s3/shapefiles/|*|*",
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
