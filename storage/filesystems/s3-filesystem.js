/**
 * dictadata/storage/filesystems/s3-filesystem
 */
"use strict";

const Storage = require("@dictadata/storage-junctions");
const { StorageFileSystem } = require("@dictadata/storage-junctions");
const { SMT, StorageResults, StorageError } = require("@dictadata/storage-junctions/types");
const { logger } = require("@dictadata/storage-junctions/utils");

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const zlib = require('zlib');
const { PassThrough } = require('stream');

const { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage")
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");


class S3FileSystem extends StorageFileSystem {

  /**
   * construct a S3FileSystem object
   * @param {*} SMT storage memory trace
   * @param {*} options filesystem options
   * @param {string} options.s3.aws_profile name of AWS profile in ~/.aws/credentials
   */
  constructor(SMT, options) {
    super(SMT, options);
    logger.debug("S3FileSystem");

    this.s3_options = {
      apiVersion: '2006-03-01'
    };

    this._dirname = ''; // last local directory
  }

  /**
   * Initialize S3 credentials.
   */
  async activate() {
    if (this.options.s3) {
      if (this.options.s3.aws_profile)
        //this.s3_options.credentials = new AWS.SharedIniFileCredentials({ profile: this.options.s3.aws_profile });
        this.s3_options.credentials = await fromNodeProviderChain({ profile: this.options.s3.aws_profile })();
    }
    else
      this.options.s3 = {};

    this.isActive = true;
  }

  /**
   * split locus into S3 bucket name and optional path prefix
   */
  splitLocus() {
    //let s3path = this.smt.locus.substring(this._fstlen);  // remove "s3:"
    let s3path = this.url.pathname;
    let bucket = s3path;
    let prefix = '';

    let p = s3path.indexOf('/');
    if (p > 0) {
      // split bucket name and path prefix
      bucket = s3path.substring(0, p);
      prefix = s3path.substring(p + 1);
    }

    if (prefix && !prefix.endsWith('/'))
      prefix = prefix + '/';

    return [bucket, prefix];
  }

  /**
   * List files located in the folder specified in smt.locus.  smt.schema is a filename that may contain wildcard characters.
   * @param {object} options Specify any options use when querying the filesystem.
   * @param {string} options.schema Override smt.schema, my contain wildcard characters.
   * @param {boolean} options.recursive Scan the specified folder and all sub-folders.
   * @param {function} options.forEach Function to execute with each entry object, optional.
   * @returns StorageResults object where data is an array of directory entry objects.
   */
  async list(options) {
    logger.debug('s3-filesystem list');

    options = Object.assign({}, this.options, options);
    let schema = options?.schema || options?.name || this.smt.schema;
    let list = [];

    try {
      var s3 = new S3Client(this.s3_options);

      let [bucket, prefix] = this.splitLocus();
      let s3params = {
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: 1000
      };

      let filespec = schema || '*';
      let rx = '(?:^|/)' + filespec + '$';
      rx = rx.replace('.', '\\.');
      rx = rx.replace('*', '.*');
      rx = new RegExp(rx);

      let lastKey = '';
      let done = false;
      while (!done) {
        if (lastKey)
          s3params['StartAfter'] = lastKey;
        const command = new ListObjectsV2Command(s3params);
        const data = await s3.send(command);
        if (data.Contents.length === 0 || data.Contents.length < s3params.MaxKeys)
          done = true;
        else
          lastKey = data.Contents[data.Contents.length - 1].Key;

        for (let entry of data.Contents) {
          if (entry.Key.charAt(entry.Key.length - 1) === '/')
            continue;  // skip folder names
          if (prefix && entry.Key.indexOf(prefix) !== 0)
            continue;
          if (!options.recursive && entry.Key.indexOf('/', prefix.length) >= 0)
            continue;  // no recursion, but controls processing longer paths (subfolders)

          if (rx.test(entry.Key)) {
            entry.name = path.basename(entry.Key);
            entry.rpath = entry.Key;  // entry.Key.substring(prefix.length);
            Object.defineProperty(entry, 'size', Object.getOwnPropertyDescriptor(entry, 'Size'));
            Object.defineProperty(entry, 'date', Object.getOwnPropertyDescriptor(entry, 'LastModified'));
            delete entry['Size'];
            delete entry['LastModified'];

            if (options.forEach)
              await options.forEach(entry);

            list.push(entry);
          }
        }
      }
      return new StorageResults(0, null, list);
    }
    catch (err) {
      logger.error(err);
      throw new StorageError(500).inner(err);
    }

  }

  /**
   * Delete Object on the S3 filesystem.
   * Depending upon the filesystem may be a delete, mark for deletion, erase, etc.
   * @param {*} options Specify any options use when querying the filesystem.
   * @param {*} options.schema Override smt.schema with a filename in the same locus.
   * @returns StorageResults object with resultCode.
   */
  async dull(options) {
    logger.debug('s3-filesystem dull');

    options = Object.assign({}, this.options, options);
    let schema = options?.schema || options?.name || this.smt.schema;

    try {
      var s3 = new S3Client(this.s3_options);

      let [bucket, prefix] = this.splitLocus();
      let s3params = {
        Bucket: bucket,
        Key: prefix + schema
      };

      let command = new DeleteObjectCommand(s3params);
      let rs = await s3.send(command);

      return new StorageResults(0);
    }
    catch (err) {
      logger.error(err);
      throw new StorageError(500).inner(err);
    }
  }

  /**
   * Create an object mode readstream from the filesystem file.
   * @param {*} options Specify any options use when querying the filesystem.
   * @param {*} options.schema Override smt.schema with a filename in the same locus.
   * @returns a node.js readstream based object if successful.
  */
  async createReadStream(options) {
    logger.debug("S3FileSystem createReadStream");
    options = Object.assign({}, this.options, options);
    let schema = options?.schema || options?.name || this.smt.schema;
    let rs = null;

    try {
      var s3 = new S3Client(this.s3_options);

      let [bucket, prefix] = this.splitLocus();
      let s3params = {
        Bucket: bucket,
        Key: prefix + schema
      };

      let command = new GetObjectCommand(s3params);
      let response = await s3.send(command);
      rs = response.Body;

      ///// check for zip
      if (s3params.Key.endsWith('.gz')) {
        var gzip = zlib.createGunzip({ flush: zlib.constants.Z_PARTIAL_FLUSH });
        rs.pipe(gzip);
        return gzip;
      }

      return rs;
    }
    catch (err) {
      logger.error(err);
      throw new StorageError(500).inner(err);
    }
  }

  /**
   * Create an object mode writestream to the filesystem file.
   * @param {*} options Specify any options use when querying the filesystem.
   * @param {*} options.schema Override smt.schema with filename at the same locus.
   * @param {*} options.append Flag used indicate overwrite or append destination file. NOT IMPLEMENTED.
   * @returns a node.js writestream based object if successful.
  */
  async createWriteStream(options) {
    logger.debug("S3FileSystem createWriteStream");
    options = Object.assign({}, this.options, options);
    let schema = options?.schema || options?.name || this.smt.schema;
    let ws = null;

    try {
      var s3 = new S3Client(this.s3_options);

      ws = new PassThrough(); // app writes to passthrough and S3 reads from passthrough
      this.isNewFile = true;  // can't append to S3 objects

      let [bucket, prefix] = this.splitLocus();
      let s3params = {
        Bucket: bucket,
        Key: prefix + schema,
        Body: ws
      };

      let upload = new Upload({ client: s3, params: s3params });
      ws.fs_ws_promise = upload.done();
      // ws.fs_ws_promise is an added property. Used so that StorageWriters
      // using filesystems know when a transfer is complete.

      ///// check for zip
      if (s3params.Key.endsWith('.gz')) {
        var gzip = zlib.createGzip({ flush: zlib.constants.Z_PARTIAL_FLUSH });
        gzip.pipe(ws);
        return gzip;
      }

      return ws;
    }
    catch (err) {
      logger.error(err);
      throw new StorageError(500).inner(err);
    }
  }

  /**
   * Download a file from S3 filesystem to local filesystem.
   * @param {object} options Specify a directory entry with any option properties used when querying the filesystem.
   * @param {object} options.entry Directory entry object containing the file information.
   * @param {SMT} options.smt smt.locus specifies the output folder in the local filesystem.
   * @param {boolean} options.keep_rpath If true replicate folder structure of remote filesystem in local filesystem.
   * @returns StorageResults object with resultCode;
   */
  async getFile(options) {
    logger.debug("s3-filesystem download");
    options = Object.assign({}, this.options, options);
    let resultCode = 0;

    try {
      let src = options.entry.Key;

      let smt = new SMT(options.smt); // smt.locus is destination folder
      let folder = smt.locus.startsWith("file:") ? smt.locus.substr(5) : smt.locus;
      let dest = path.join(folder, (options.keep_rpath ? options.entry.rpath : options.entry.name));
      let dirname = path.dirname(dest);
      if (dirname !== this._dirname && !fs.existsSync(dirname)) {
        await fsp.mkdir(dirname, { recursive: true });
        this._dirname = dirname;
      }
      logger.verbose("  " + src + " >> " + dest);

      var s3 = new S3Client(this.s3_options);

      let [bucket, prefix] = this.splitLocus();
      let s3params = {
        Bucket: bucket,
        Key: src
      };

      let command = new GetObjectCommand(s3params);
      let response = await s3.send(command)
      let rs = response.Body;

      // save to local file
      rs.pipe(fs.createWriteStream(dest));

      return new StorageResults(resultCode);
    }
    catch (err) {
      logger.error(err);
      throw new StorageError(500).inner(err);
    }
  }

  /**
   * Upload a local file to the remote filesystem.
   * @param {object} options Specify a directory entry with any option properties used when querying the filesystem.
   * @param {SMT} options.smt smt.locus specifies the source folder in the local filesystem.
   * @param {object} options.entry Directory entry object containing the file information.
   * @param {boolean} options.keep_rpath If true replicate folder structure of local filesystem in remote filesystem.
   * @returns StorageResults object with resultCode.
   */
  async putFile(options) {
    logger.debug("s3-filesystem upload");
    options = Object.assign({}, this.options, options);
    let resultCode = 0;

    try {
      let smt = new SMT(options.smt); // smt.locus is source folder
      let folder = smt.locus.startsWith("file:") ? smt.locus.substr(5) : smt.locus;
      let src = path.join(folder, options.entry.rpath);

      let [bucket, prefix] = this.splitLocus();
      let dest = prefix + (options.keep_rpath ? options.entry.rpath : options.entry.name).split(path.sep).join(path.posix.sep);
      logger.verbose("  " + src + " >> " + dest);

      // upload file
      let ws = fs.createReadStream(src);
      this.isNewFile = true;  // can't append to S3 objects

      var s3 = new S3Client(this.s3_options);
      let s3params = {
        Bucket: bucket,
        Key: dest,
        Body: ws
      };

      let upload = new Upload({ client: s3, params: s3params });
      await upload.done();

      return new StorageResults(resultCode);
    }
    catch (err) {
      logger.error(err);
      throw new StorageError(500).inner(err);
    }
  }

};

module.exports = exports = S3FileSystem;
Storage.FileSystems.use('S3', S3FileSystem);
