var expect = require('chai').expect;
var sinon = require('sinon');
var winston = require('winston');
var Config = require('../.').Config;
var Controller = require('./RC');
var HazelcastClient = require('../.').Client;
describe('Logging Test', function() {
    var cluster;
    var client;

    var winstonAdapter = {
        logger: new (winston.Logger)({
            transports: [
                new (winston.transports.Console)()
            ]
        }),

        levels: [
            'error',
            'warn',
            'info',
            'debug',
            'silly'
        ],

        log: function(level, className, message, furtherInfo) {
            this.logger.log(this.levels[level], className + ' ' + message);
        }
    };

    before(function() {
        return Controller.createCluster(null, null).then(function(res) {
            cluster = res;
            return Controller.startMember(cluster.id);
        });
    });

    after(function() {
        return Controller.shutdownCluster(cluster.id);
    });

    beforeEach(function() {
        sinon.spy(console, 'log');
    });

    afterEach(function() {
        if (client != null) {
            client.shutdown();
            client = null;
        }
        console.log.restore();
    });

    it('winston should emit logging event', function() {
        var loggingHappened = false;
        winstonAdapter.logger.on('logging', function(transport, level, msg, meta) {
            loggingHappened = true;
        });
        var cfg = new Config.ClientConfig();
        cfg.properties['hazelcast.logging'] = winstonAdapter;
        return HazelcastClient.newHazelcastClient(cfg).then(function(hz) {
            client = hz;
            return expect(loggingHappened).to.be.true;
        });
    });

    it('no logging', function() {
        var cfg = new Config.ClientConfig();
        cfg.properties['hazelcast.logging'] = 'off';
        return HazelcastClient.newHazelcastClient(cfg).then(function(hz) {
            client = hz;
            return sinon.assert.notCalled(console.log);
        });
    });

    it('default logging in case of empty property', function() {
        return HazelcastClient.newHazelcastClient().then(function(hz) {
            client = hz;
            return sinon.assert.called(console.log);
        });
    });

    it('default logging in case of default property', function() {
        var cfg = new Config.ClientConfig();
        cfg.properties['hazelcast.logging'] = 'default';
        return HazelcastClient.newHazelcastClient(cfg).then(function(hz) {
            client = hz;
            return sinon.assert.called(console.log);
        });
    });

    it('error in case of unknown property value', function() {
        var cfg = new Config.ClientConfig();
        cfg.properties['hazelcast.logging'] = 'unknw';
        return expect(HazelcastClient.newHazelcastClient.bind(this, cfg)).to.throw(Error);
    });
});
