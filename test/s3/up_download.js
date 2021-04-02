/**
 * test/S3/up_download
 */
"use strict";

require("../register");
const { logger } = require('@dictadata/storage-junctions').utils;
const { download, upload } = require('@dictadata/storage-junctions').tests;

logger.info("=== tests: S3 uploads/downloads");

async function test_1() {
  logger.info("=== download files from S3 folder");

  if (await download({
    origin: {
      smt: "*|S3:dictadata.org/data/test/|*.csv|*",
      options: {
        recursive: false
      }
    },
    terminal: {
      options: {
        downloads: "./data/output/s3/downloads/"
      }
    }
  })) return 1;
}

async function test_2() {
  logger.info("=== upload files to S3 folder");

  if (await upload({
    origin: {
      options: {
        uploads: "./data/test/*.csv",
        recursive: false
      }
    },
    terminal: {
      smt: "*|S3:dictadata.org/data/output/uploads/|*|*",
      options: {}
    }
  })) return 1;
}

async function test_3() {
  logger.info("=== upload shape files");

  if (await upload({
    origin: {
      options: {
        uploads: "./data/shapefiles/United States/Iowa/*.*",
        recursive: true
      }
    },
    terminal: {
      smt: "*|S3:dictadata.org/shapefiles/United States/Iowa/|*|*",
      options: {
        useRPath: true
      }
    }
  })) return 1;
}

async function test_4() {
  logger.info("=== download shape files");

  if (await download({
    origin: {
      smt: "*|S3:dictadata.org/shapefiles/|*.*|*",
      options: {
        recursive: true
      }
    },
    terminal: {
      options: {
        downloads: "./data/output/s3/shapefiles/",
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
