/**
 * storage-junctions/new-filesystem.js
 * 
 * This class is a copy of the fs-filesystem class from the storage-junctions library.
 * Modify to implement the new filesystem.
 * 
 */
"use strict";

const { FileSystem, StorageError } = require("@dictadata/storage-junctions");
const logger = require("../logger");

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const zlib = require('zlib');


module.exports = exports = class NewFileSystem extends FileSystem {

  /**
   *
   * @param {*} SMT
   * @param {*} options
   */
  constructor(SMT, options) {
    super(SMT, options);
    logger.debug("NewFileSystem");

    this.fsType = this.options.fsType || 'newfs';
    this._fstlen = this.fsType.length + 1;  // newfs:
  }

  async list(options) {
    options = Object.assign({}, this.options, options);
    var list = [];

    try {
      let dirpath = this.smt.locus.substring(this._fstlen);  // remove "newfs:"

      let filespec = options.schema || this.smt.schema || '*';
      let rx = '^' + filespec + '$';
      rx = rx.replace('.', '\\.');
      rx = rx.replace('*', '.*');
      rx = new RegExp(rx);

      // recursive scanner function
      async function scanner(dirpath, relpath, options) {

        let dir = await fsp.opendir(dirpath + relpath);
        logger.debug("opendir ", dirpath + relpath);

        for await (let dirent of dir) {
          //logger.info(dirent.name);
          if (dirent.isDirectory() && options.recursive) {
            let subpath = relpath + dirent.name + "/";
            await scanner(dirpath, subpath, options);
          }
          else if (dirent.isFile() && rx.test(dirent.name)) {
            let filepath = relpath + dirent.name;
            if (options.forEach)
              await options.forEach(filepath);

            list.push(filepath);
          }
        }
        //await dir.close();
      }

      await scanner(dirpath, "", options);
    }
    catch (err) {
      logger.error(err);
      throw err;
    }

    return list;
  }

  /**
  * createReadStream
  */
  async createReadStream() {
    logger.debug("NewFileSystem createReadStream");
    let options = this.options || {};
    let rs = null;

    try {
      let filename = path.join(this.smt.locus.substring(this._fstlen), this.smt.schema) || '';  // remove "newfs:"
      rs = fs.createReadStream(filename);

      ///// check for zip
      if (filename.endsWith('.gz')) {
        var gzip = zlib.createGunzip();
        rs.pipe(gzip);
        return gzip;
      }
    }
    catch (err) {
      logger.error(err);
      throw err;
    }

    return rs;
  }

  /**
  * createWriteStream
  */
  async createWriteStream() {
    logger.debug("newFileSystem createWriteStream");
    let options = this.options || {};
    let ws = false;

    try {
      let filename = path.join(this.smt.locus.substring(this._fstlen), this.smt.schema) || '';  // remove "newfs:"
      let append = this.options.append || false;

      this.isNewFile = !(append && fs.existsSync(filename));

      let flags = append ? 'a' : 'w';
      ws = fs.createWriteStream(filename, { flags: flags });

      ///// check for zip
      if (filename.endsWith('.gz')) {
        var gzip = zlib.createGzip();
        gzip.pipe(ws);
        return gzip;
      }
    }
    catch (err) {
      logger.error(err);
      throw err;
    }

    return ws;
  }

};
