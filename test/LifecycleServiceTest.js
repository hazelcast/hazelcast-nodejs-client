var RC = require('./RC');
var HazelcastClient = require('../.');
var Config = require('../lib/Config');
var expect = require('chai').expect;

describe('LifecycleService', function() {
    var cluster;
    var client;

    before(function() {
        return RC.createCluster(null, null).then(function(res) {
            cluster = res;
            return RC.startMember(cluster.id);
        });
    });

    after(function() {
        return RC.shutdownCluster(cluster.id);
    });

    it('client should emit starting, started, shuttingDown and shutdown events in order', function(done) {
        var cfg = new Config.ClientConfig();
        var expectedState = 'starting';
        cfg.listeners.addLifecycleListener(
            function(state) {
                if (state === 'starting' && expectedState === 'starting') {
                    expectedState = 'started'
                } else if (state === 'started' && expectedState === 'started') {
                    expectedState = 'shuttingDown';
                } else if (state === 'shuttingDown' && expectedState === 'shuttingDown') {
                    expectedState = 'shutdown';
                } else if (state === 'shutdown' && expectedState === 'shutdown') {
                    done();
                } else {
                    done('Got lifecycle event ' + state + ' instead of ' + expectedState);
                }
            }
        );
        HazelcastClient.newHazelcastClient(cfg).then(function(client) {
            client.shutdown();
        });
    });

    it('event listener should get shuttingDown and shutdown events when added after startup', function(done) {
        var expectedState = 'shuttingDown';
        HazelcastClient.newHazelcastClient().then(function(client) {
            client.lifecycleService.on('lifecycleEvent', function(state) {
                if (state === 'shuttingDown' && expectedState === 'shuttingDown') {
                    expectedState = 'shutdown';
                } else if (state === 'shutdown' && expectedState === 'shutdown') {
                    done();
                } else {
                    done('Got lifecycle event ' + state + ' instead of ' + expectedState);
                }
            });
            client.shutdown();
        });
    });

    it('isRunning returns correct values at lifecycle stages', function(done) {
        HazelcastClient.newHazelcastClient().then(function(client) {
            client.lifecycleService.on('lifecycleEvent',
                function(state) {
                    if (state === 'starting') {
                        expect(client.lifecycleService.isRunning()).to.be.false;
                    } else if (state === 'started') {
                        expect(client.lifecycleService.isRunning()).to.be.true;
                    } else if (state === 'shuttingDown') {
                        expect(client.lifecycleService.isRunning()).to.be.false;
                    } else if (state === 'shutdown') {
                        expect(client.lifecycleService.isRunning()).to.be.false;
                        done();
                    } else {
                        done('Got lifecycle event ' + state + ' instead of ' + expectedState);
                    }
                }
            );
            client.shutdown();
        });
    });

    it('emitLifecycleEvent throws for invalid event', function(done) {
        HazelcastClient.newHazelcastClient().then(function(client) {
            expect(client.lifecycleService.emitLifecycleEvent.bind(client.lifecycleService, 'invalid')).to.throw(Error);
            client.shutdown();
            done();
        });
    })
});
