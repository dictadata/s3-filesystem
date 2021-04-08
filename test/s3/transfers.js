/**
 * test/s3/transfers
 */
"use strict";

require("../register");
const { logger } = require('@dictadata/storage-junctions').utils;
const { transfer, dullSchema } = require('@dictadata/storage-junctions').tests;

logger.info("=== Test: S3 transfers");

async function s3Destination() {
  logger.verbose("=== S3 destination");

  logger.verbose('=== s3: csv_output.csv');
  if (await dullSchema({
    smt: "csv|s3:dictadata.org/data/output/csv/|output.csv|*"
  })) return 1;
  
  if (await transfer({
    origin: {
      smt: "csv|./data/test/|foofile.csv.gz|*",
      options: {
        header: true
      }
    },
    terminal: {
      smt: "csv|s3:dictadata.org/data/output/csv/|output.csv|*",
      options: {
        header: true,
        "s3": {
          "aws_profile": ""
        }
      }
    }
  })) return 1;

  logger.verbose('=== s3: csv_output.csv.gz');
  if (await transfer({
    origin: {
      smt: "csv|./data/test/|foofile.csv|*",
      options: {
        header: true
      }
    },
    terminal: {
      smt: "csv|s3:dictadata.org/data/output/csv/|output.csv.gz|*",
      options: {
        header: true,
        "s3": {
          "aws_profile": ""
        }
      }
    }
  })) return 1;

  logger.verbose('=== s3: json_output.json');
  if (await transfer({
    origin: {
      smt: "json|./data/test/|foofile.json.gz|*"
    },
    terminal: {
      smt: "json|s3:dictadata.org/data/output/json/|output.json|*",
      options: {
        "s3": {
          "aws_profile": ""
        }
      }
    }
  })) return 1;

  logger.verbose('=== s3: json_output.json.gz');
  if (await transfer({
    origin: {
      smt: "json|./data/test/|foofile.json|*"
    },
    terminal: {
      smt: "json|s3:dictadata.org/data/output/json/|output.json.gz|*",
      options: {
        "s3": {
          "aws_profile": ""
        }
      }
    }
  })) return 1;

}

async function s3Source() {
  logger.verbose("=== S3 source");

  logger.verbose('=== s3_output.csv');
  if (await transfer({
    origin: {
      smt: "csv|s3:dictadata.org/data/test/|foofile.csv.gz|*",
      options: {
        header: true,
        "s3": {
          "aws_profile": ""
        }
      }
    },
    terminal: {
      smt: "csv|./data/output/s3/|output.csv|*",
      options: {
        header: true
      }
    }
  })) return 1;

  logger.verbose('=== s3_output.csv.gz');
  if (await transfer({
    origin: {
      smt: "csv|s3:dictadata.org/data/test/|foofile.csv|*",
      options: {
        header: true,
        "s3": {
          "aws_profile": ""
        }
      }
    },
    terminal: {
      smt: "csv|./data/output/s3/|output.csv.gz|*",
      options: {
        header: true
      }
    }
  })) return 1;

  logger.verbose('=== s3_output.json');
  if (await transfer({
    origin: {
      smt: "json|s3:dictadata.org/data/test/|foofile.json.gz|*",
      options: {
        "s3": {
          "aws_profile": ""
        }
      }
    },
    terminal: {
      smt: "json|./data/output/s3/|output.json|*"
    }
  })) return 1;

  logger.verbose('=== s3_output.json.gz');
  if (await transfer({
    origin: {
      smt: "json|s3:dictadata.org/data/test/|foofile.json|*",
      options: {
        "s3": {
          "aws_profile": ""
        }
      }
    },
    terminal: {
      smt: "json|./data/output/s3/|output.json.gz|*"
    }
  })) return 1;

}

(async () => {
  if (await s3Source()) return;
  if (await s3Destination()) return;
})();
