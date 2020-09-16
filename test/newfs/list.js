/**
 * test/newfs/list
 */
"use strict";

const list = require('../lib/_list');
const logger = require('../../lib/logger');

logger.info("=== tests: newfs list");

async function tests() {

  logger.info("=== list newfs directory (forEach)");
  await list({
    origin: {
      smt: "json|./test/data/|*.json|*",
      options: {
        recursive: false,
        forEach: (name) => {
          logger.info("- " + name);
        }
      }
    },
    terminal: "./test/output/newfs_list_1.json"
  });

  logger.info("=== list newfs directory (recursive)");
  await list({
    origin: {
      smt: {
        model: "json",
        locus: "./test/",
        schema: "*.json",
        key: "*"
      },
      options: {
        schema: "foofile_*.json",
        recursive: true
      }
    },
    terminal: "./test/output/newfs_list_2.json"
  });

}

tests();
