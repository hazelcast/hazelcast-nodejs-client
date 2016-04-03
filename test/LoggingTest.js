var expect = require('chai').expect;
var sinon = require('sinon');
var winston = require('winston');
var Config = require('../lib/Config');
var HazelcastClient = require('../lib/HazelcastClient');
describe.skip('Logging Test', function() {
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

    beforeEach(function() {
        sinon.spy(console, 'log');
    });

    afterEach(function() {
        console.log.restore();
    });

    it('winston should emit logging event', function(done) {
        var calledDone = false;
        winstonAdapter.logger.on('logging', function(transport, level, msg, meta) {
            if (!calledDone) {
                calledDone = true;
                done();
            }
        });
        var cfg = new Config.ClientConfig();
        cfg.properties['hazelcast.logging'] = winstonAdapter;
        return HazelcastClient.newHazelcastClient(cfg).then(function(hz) {
            client = hz;
        });
    });

    it('no logging', function() {
        var cfg = new Config.ClientConfig();
        cfg.properties['hazelcast.logging'] = 'off';
        return HazelcastClient.newHazelcastClient(cfg).then(function(hz) {
            return sinon.assert.notCalled(console.log);
        });
    });

    it('default logging in case of empty property', function() {
        return HazelcastClient.newHazelcastClient().then(function(hz) {
            return sinon.assert.called(console.log);
        });
    });

    it('default logging in case of default property', function() {
        var cfg = new Config.ClientConfig();
        cfg.properties['hazelcast.logging'] = 'default';
        return HazelcastClient.newHazelcastClient(cfg).then(function(hz) {
            return sinon.assert.called(console.log);
        });
    });

    it('error in case of unknown property value', function() {
        var cfg = new Config.ClientConfig();
        cfg.properties['hazelcast.logging'] = 'unknw';
        return expect(HazelcastClient.newHazelcastClient.bind(this, cfg)).to.throw(Error);
    })
});
