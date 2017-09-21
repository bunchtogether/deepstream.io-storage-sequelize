// @flow

const expect = require('chai').expect;
const Connector = require('../src/connector');
const EventEmitter = require('events').EventEmitter;
const Sequelize = require('sequelize');

const database = new Sequelize('sqlite://:memory:');

describe('the message connector has the correct structure', () => {
  let connector;

  it('throws an error if required connection parameters are missing', () => {
    // $FlowNewLine
    expect(() => { new Connector('gibberish'); }).to.throw(/Missing/); // eslint-disable-line no-new
  });

  it('creates the connector', (done) => {
    connector = new Connector(database, 'example');
    expect(connector.isReady).to.equal(false);
    connector.on('ready', done);
  });

  it('implements the cache/storage connector interface', () => {
    expect(connector.name).to.be.a('string');
    expect(connector.version).to.be.a('string');
    expect(connector.get).to.be.a('function');
    expect(connector.set).to.be.a('function');
    expect(connector.delete).to.be.a('function');
    expect(connector instanceof EventEmitter).to.equal(true);
  });

  it('destroys the connector', (done) => {
    connector.destroy(done);
  });
});

describe('creates multiple connectors in parallel', () => {
  const connectors = [];

  it('creates four connectors', (done) => {
    let ready = 0;
    let i;
    const num = 4;
    let conn;

    for (i = 0; i < num; i += 1) {
      conn = new Connector(database, 'example');
      conn.on('ready', () => { // eslint-disable-line no-loop-func
        ready += 1;
        if (ready === num) {
          done();
        }
      });
      connectors.push(conn);
    }
  });

  it('destroys four connectors', (done) => {
    let ready = connectors.length;
    let i;

    for (i = 0; i < connectors.length; i += 1) {
      connectors[i].destroy(() => { // eslint-disable-line no-loop-func
        ready -= 1;
        if (ready === 0) {
          done();
        }
      });
    }
  });
});

describe('creates databases', () => {
  let connector;

  it('creates the connector', (done) => {
    connector = new Connector(database, 'example');
    expect(connector.isReady).to.equal(false);
    connector.on('ready', done);
  });

  it('destroys the connector', (done) => {
    connector.destroy(done);
  });
});

describe('sets and gets values', () => {
  let connector;
  const ITEM_NAME = 'some-table/some-key';

  it('creates the connector', (done) => {
    connector = new Connector(database, 'example');
    expect(connector.isReady).to.equal(false);
    connector.on('ready', done);
  });

  it('retrieves a non existing value', (done) => {
    connector.get(ITEM_NAME, (error, value) => {
      expect(error).to.equal(null);
      expect(value).to.equal(null);
      done();
    });
  });

  it('sets a value for a non existing table', (done) => {
    connector.set(ITEM_NAME, { _d: { v: 10 }, firstname: 'Wolfram' }, (error) => {
      expect(error).to.equal(null);
      // give it some time to receive the notifications
      setTimeout(done, 300);
    });
  });

  it('retrieves an existing value', (done) => {
    connector.get(ITEM_NAME, (error, value) => {
      expect(error).to.equal(null);
      expect(value).to.deep.equal({ _d: { v: 10 }, firstname: 'Wolfram' });
      done();
    });
  });

  it('sets a value for an existing table', (done) => {
    connector.set('some-table/another-key', { _d: { v: 10 }, firstname: 'Egon' }, (error) => {
      expect(error).to.equal(null);
      // give it some time to receive the notifications
      setTimeout(done, 300);
    });
  });


  it('deletes a value', (done) => {
    connector.delete(ITEM_NAME, (error) => {
      expect(error).to.equal(null);
      // give it some time to receive the notifications
      setTimeout(done, 300);
    });
  });


  it('Can\'t retrieve a deleted value', (done) => {
    connector.get(ITEM_NAME, (error, value) => {
      expect(error).to.equal(null);
      expect(value).to.equal(null);
      done();
    });
  });

  it('destroys the connector', (done) => {
    connector.destroy(done);
  });
});


describe('advanced sets', () => {
  let connector;
  const ITEM_NAME = 'some-other-table/some-other-key';

  it('creates the connector', (done) => {
    connector = new Connector(database, 'example');
    expect(connector.isReady).to.equal(false);
    connector.on('ready', done);
  });

  it('sets a value for a non existing table', (done) => {
    connector.set(ITEM_NAME, { _d: { v: 10 }, testValue: 'A' }, (error) => {
      expect(error).to.equal(null);
      done();
    });
  });

  it('sets value B', (done) => {
    connector.set(ITEM_NAME, { _d: { v: 10 }, testValue: 'B' }, (error) => {
      expect(error).to.equal(null);
      done();
    });
  });

  it('sets value C', (done) => {
    connector.set(ITEM_NAME, { _d: { v: 10 }, testValue: 'C' }, (error) => {
      expect(error).to.equal(null);
      done();
    });
  });

  it('sets value D', (done) => {
    connector.set(ITEM_NAME, { _d: { v: 10 }, testValue: 'D' }, (error) => {
      expect(error).to.equal(null);
      done();
    });
  });

  it('gets the latest value', (done) => {
    connector.get(ITEM_NAME, (error, item) => {
      expect(error).to.be.a('null');
      expect(item.testValue).to.equal('D');
      done();
    });
  });


  it('writes multiple values in quick succession to an existing table', (done) => {
    connector.set('some-table/itemA', { val: 1 }, () => {});
    connector.set('some-table/itemA', { val: 2 }, () => {});
    connector.set('some-table/itemA', { val: 3 }, () => {});
    connector.set('some-table/itemA', { val: 4 }, () => {});
    connector.set('some-table/itemA', { val: 5 }, (error) => {
      expect(error).to.be.a('null');
      done();
    });
  });

  it('retrieves the latest item from the last operation', (done) => {
    connector.get('some-table/itemA', (error, item) => {
      expect(error).to.be.a('null');
      expect(item.val).to.equal(5);
      done();
    });
  });

  it('writes multiple values in quick succession to a new table', (done) => {
    connector.set('new-table/itemA', { val: 6 }, () => {});
    connector.set('new-table/itemA', { val: 7 }, () => {});
    connector.set('new-table/itemA', { val: 8 }, () => {});
    connector.set('new-table/itemA', { val: 9 }, () => {});
    connector.set('new-table/itemA', { val: 10 }, (error) => {
      expect(error).to.be.a('null');
      done();
    });
  });

  it('retrieves the latest item from the last operation', (done) => {
    connector.get('new-table/itemA', (error, item) => {
      expect(error).to.be.a('null');
      expect(item.val).to.equal(10);
      done();
    });
  });

  it('writes a combination of values in quick succession', (done) => {
    connector.set('table-a/item-a', { val: 'aa' }, () => {});
    connector.set('table-a/item-b', { val: 'ab' }, () => {});
    connector.set('table-b/item-a', { val: 'ba' }, () => {});
    connector.set('table-b/item-b', { val: 'bb' }, (error) => {
      expect(error).to.be.a('null');
      done();
    });
  });

  it('retrieves item aa', (done) => {
    connector.get('table-a/item-a', (error, item) => {
      expect(error).to.be.a('null');
      expect(item.val).to.equal('aa');
      done();
    });
  });

  it('retrieves item ab', (done) => {
    connector.get('table-a/item-b', (error, item) => {
      expect(error).to.be.a('null');
      expect(item.val).to.equal('ab');
      done();
    });
  });

  it('retrieves item ba', (done) => {
    connector.get('table-b/item-a', (error, item) => {
      expect(error).to.be.a('null');
      expect(item.val).to.equal('ba');
      done();
    });
  });

  it('retrieves item bb', (done) => {
    connector.get('table-b/item-b', (error, item) => {
      expect(error).to.be.a('null');
      expect(item.val).to.equal('bb');
      setTimeout(done, 600);
    });
  });

  it('deletes a first entry from table-a', (done) => {
    connector.delete('table-a/item-a', (err) => {
      expect(err).to.be.a('null');
      setTimeout(done, 300);
    });
  });

  it('deletes the second entry from table-a', (done) => {
    connector.delete('table-a/item-b', (err) => {
      expect(err).to.be.a('null');
      setTimeout(done, 300);
    });
  });

  it('destroys the connector', (done) => {
    connector.destroy(done);
  });
});

describe('destroys databases', () => {
  let connector;

  it('creates the connector', (done) => {
    connector = new Connector(database, 'example');
    expect(connector.isReady).to.equal(false);
    connector.on('ready', done);
  });

  it('destroys the connector', (done) => {
    connector.destroy(done);
  });
});
