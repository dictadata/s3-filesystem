/**
 * test/s3/list
 */
"use strict";

require("../register");
const { logger } = require("@dictadata/storage-junctions/utils");
const { list } = require('@dictadata/storage-junctions/test');


logger.info("=== tests: S3 list");

async function tests() {

  logger.info("=== list S3 bucket (forEach)");
  if(await list({
    origin: {
      smt: "json|s3:dictadata.net/data/test/input/|foofile*.json|*",
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
        locus: "s3:dictadata.net/data/test/input/",
        schema: "*.json",
        key: "*"
      },
      options: {
        s3: {
          aws_profile: "dictadata"
        },
        schema: "*.encoding.json",
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
