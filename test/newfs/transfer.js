/**
 * test/newfs/transfers
 */
"use strict";

const storage = require("@dictadata/storage-junctions");
const NewFileStorage = require("../../lib/filesystems/new-filesystem")

const transfer = require('../lib/_transfer');
const logger = require('../../lib/logger');

logger.info("=== Test: gzip transfers");

logger.info("--- adding NewFileStorage to storage cortex");
storage.FileSystems.use("newfs", NewFileStorage);

async function tests() {

  logger.verbose('=== csv => newfs_gzip_output.csv.gz');
  await transfer({
    origin: {
      smt: "csv|newfs:./test/data/|foofile.csv|*"
    },
    terminal: {
      smt: "csv|newfs:./test/output/|newfs_gzip_output.csv.gz|*"
    }
  });

  logger.verbose('=== csv.gz => newfs_gzip_output.csv');
  await transfer({
    origin: {
      smt: "csv|newfs:./test/data/|foofile.csv.gz|*"
    },
    terminal: {
      smt: "csv|newfs:./test/output/|newfs_gzip_output.csv|*"
    }
  });

  logger.verbose('=== json => newfs_gzip_output.json.gz');
  await transfer({
    origin: {
      smt: "json|newfs:./test/data/|foofile.json|*"
    },
    terminal: {
      smt: "json|newfs:./test/output/|newfs_gzip_output.json.gz|*"
    }
  });

  logger.verbose('=== json.gz => newfs_gzip_output.json');
  await transfer({
    origin: {
      smt: "json|newfs:./test/data/|foofile.json.gz|*"
    },
    terminal: {
      smt: "json|newfs:./test/output/|newfs_gzip_output.json|*"
    }
  });

}

tests();
