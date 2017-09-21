//      

const Sequelize = require('sequelize');
const events = require('events');
const pckg = require('../package.json');

module.exports = class Connector extends events.EventEmitter {
                
               
                  
               
                   
                  

  constructor(database        , tablename        ) {
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

  destroy(callback          ) {
    callback();
  }

  async set(key       , value        , callback          )               {
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

  async get(key       , callback         )            {
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

  async delete(key       , callback         )            {
    try {
      const result = await this.Storage.findById(key);
      await result.destroy();
      callback(null);
    } catch (error) {
      callback(error);
    }
  }
};
