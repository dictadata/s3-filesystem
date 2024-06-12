/**
 * test/s3/list
 */
"use strict";

require("../_register");
const { logger } = require("@dictadata/lib");
const { list } = require('@dictadata/storage-junctions/test');


logger.info("=== tests: S3 list");

async function tests() {

  logger.info("=== list S3 bucket (forEach)");
  if(await list({
    origin: {
      smt: "json|s3:dictadata/test/data/input/|foofile*.json|*",
      options: {
        recursive: false,
        forEach: (entry) => {
          logger.info("- " + entry.name);
        }
      }
    },
    terminal: {
      output: "./test/data/output/s3/list_1.json"
    }
  }, 2)) return 1;

  logger.info("=== list S3 bucket (recursive)");
  if (await list({
    origin: {
      smt: {
        model: "json",
        locus: "s3:dictadata/test/data/input/",
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
      output: "./test/data/output/s3/list_2.json"
    }
  }, 2)) return 1;

}

(async () => {
  await tests();
})();
