// @flow

const Sequelize = require('sequelize');
const events = require('events');
const pckg = require('../package.json');

module.exports = class Connector extends events.EventEmitter {
  isReady: bool;
  name: string;
  version: string;
  type: string;
  database: Object;
  Storage: Object;

  constructor(database: Object, tablename: string) {
    super();
    this.isReady = false;
    this.name = pckg.name;
    this.version = pckg.version;
    if (!database) {
      throw new Error("Missing required argument 'database'");
    }
    if (!tablename) {
      throw new Error("Missing required argument 'tablename'");
    }
    this.Storage = database.define(tablename, {
      key: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      value: {
        type: Sequelize.TEXT('medium'), // eslint-disable-line new-cap
        allowNull: false,
      },
    }, {
      timestamps: true,
      underscored: true,
    });
    this.database = database;
    this.Storage.sync().then(() => {
      this.isReady = true;
      this.emit('ready');
    }).catch((error) => {
      this.emit('error', error);
    });
  }

  destroy(callback: Function) {
    callback();
  }

  async set(key:string, value: Object, callback: Function):Promise<void> {
    try {
      await this.Storage.upsert({
        key,
        value: JSON.stringify(value),
      });
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  async get(key:string, callback:Function):Promise<*> {
    try {
      const result = await this.Storage.findById(key);
      if (result !== null) {
        callback(null, JSON.parse(result.value));
      } else {
        callback(null, null);
      }
    } catch (error) {
      callback(error, null);
    }
  }

  async delete(key:string, callback:Function):Promise<*> {
    try {
      const result = await this.Storage.findById(key);
      await result.destroy();
      callback(null);
    } catch (error) {
      callback(error);
    }
  }
};
