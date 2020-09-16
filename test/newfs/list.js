/**
 * test/newfs/list
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const NewFileStorage = require("../../lib/filesystems/new-filesystem")

const list = require('../lib/_list');
const logger = require('../../lib/logger');

logger.info("=== tests: newfs list");

logger.info("--- adding NewFileStorage to storage cortex");
storage.FileSystems.use("newfs", NewFileStorage);

async function tests() {

  logger.info("=== list newfs directory (forEach)");
  await list({
    origin: {
      smt: "json|newfs:./test/data/|*.json|*",
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
        locus: "newfs:./test/",
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
