var Controller = require('./RC');
var expect = require('chai').expect;
var HazelcastClient = require('../.').Client;
var Config = require('../.').Config;
var Util = require('./Util');

describe.skip('Listeners on reconnect', function () {

    var client;
    var members = [];
    var cluster;

    function startMembers(clusterId, count) {
        var promises = [];
        for (var i=0;i<count;i++) {
            promises.push(Controller.startMember(clusterId));
        }
        return Promise.all(promises).then(function (mems) {
            members = mems;
        });
    }

    function shutdownRandomMembers(clusterId, count) {
        var removePromises = [];
        for (var i=0;i<count;i++) {
            removePromises.push(Controller.shutdownMember(clusterId, members[i].uuid));
        }
        return Promise.all(removePromises);
    }

    beforeEach(function () {
        return Controller.createCluster(null, null).then(function (cl) {
            cluster = cl;
        });
    });

    afterEach(function() {
        return client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    it('open and close three members', function (done) {
        this.timeout(40000);
        var removedCount = 0;
        var map;
        startMembers(cluster.id, 3).then(function () {
            return HazelcastClient.newHazelcastClient();
        }).then(function (cl) {
            client = cl;
            client.getClusterService().on('memberRemoved', function (mem) {
                removedCount++;
                console.log(mem);
            });

            map = client.getMap('testmap');
            var listenerObject = {
                added: function(key, oldValue, value, mergingValue) {
                    try {
                        expect(key).to.equal('keyx');
                        expect(oldValue).to.be.undefined;
                        expect(value).to.equal('valx');
                        expect(mergingValue).to.be.undefined;
                        done();
                    } catch (err) {
                        done(err);
                    }
                }
            };
            return map.addEntryListener(listenerObject, 'keyx', true);
        }).then(function () {
            return shutdownRandomMembers(cluster.id, 2);
        }).then(function () {
            return Util.promiseLater(5000, function() {
                console.log('safsdf');
                map.put('asad','dsafds');
                map.put('keyx', 'valx').then(function(x) {
                    console.log(x);
                });
            });
        });
    })



});
