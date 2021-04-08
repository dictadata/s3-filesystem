/**
 * test/s3/list
 */
"use strict";

require("../register");
const { logger } = require('@dictadata/storage-junctions').utils;
const { list } = require('@dictadata/storage-junctions').tests;


logger.info("=== tests: S3 list");

async function tests() {

  logger.info("=== list S3 bucket (forEach)");
  if(await list({
    origin: {
      smt: "json|s3:dictadata.org/data/test/|*.json|*",
      options: {
        recursive: false,
        forEach: (entry) => {
          logger.info("- " + entry.name);
        }
      }
    },
    terminal: {
      output: "./data/output/s3/list_1.json"
    }
  })) return 1;

  logger.info("=== list S3 bucket (recursive)");
  if (await list({
    origin: {
      smt: {
        model: "json",
        locus: "s3:dictadata.org/data/",
        schema: "*.json",
        key: "*"
      },
      options: {
        s3: {
          aws_profile: "dictadata"
        },
        schema: "foofile_*.json",
        recursive: true
      }
    },
    terminal: {
      output: "./data/output/s3/list_2.json"
    }
  })) return 1;

}

(async () => {
  await tests();
})();
