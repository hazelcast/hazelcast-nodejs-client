var Controller = require('./RC');
var expect = require('chai').expect;
var HazelcastClient = require('../.').Client;
var Config = require('../.').Config;
var Util = require('./Util');
var Promise = require('bluebird');

describe('Listeners on reconnect', function () {

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
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    [true, false].forEach(function (isSmart) {


        function closeTwoMembersOfThreeAndTestListener(done, membersToClose, turnoffMember) {
            var map;
            var member1;
            var member2;
            var member3;
            Controller.startMember(cluster.id).then(function (m) {
                member1 = m;
                return Controller.startMember(cluster.id);
            }).then(function (m) {
                member2 = m;
                return Controller.startMember(cluster.id);
            }).then(function (m) {
                member3 = m;
                var cfg = new Config.ClientConfig();
                cfg.networkConfig.smartRouting = isSmart;
                return HazelcastClient.newHazelcastClient();
            }).then(function (cl) {
                client = cl;
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
                return Promise.all([
                    turnoffMember(cluster.id, member2.uuid),
                    turnoffMember(cluster.id, member3.uuid)
                ]);
            }).then(function () {
                map.put('keyx', 'valx');
            });
        }

        it('kill two members, listener still receives map.put event [smart=' + isSmart +']', function (done) {
            this.timeout(20000);
            closeTwoMembersOfThreeAndTestListener(done, [0, 1], Controller.terminateMember);
        });

        it('shutdown two members, listener still receives map.put event [smart=' + isSmart +']', function (done) {
            this.timeout(20000);
            closeTwoMembersOfThreeAndTestListener(done, [0, 1], Controller.shutdownMember);
        });

        it('restart member, listener still receives map.put event [smart=' + isSmart + ']', function (done) {
            this.timeout(7000);
            var map;
            var member;
            Controller.startMember(cluster.id).then(function (m) {
                member = m;
                var cfg = new Config.ClientConfig();
                cfg.networkConfig.smartRouting = isSmart;
                cfg.properties['hazelcast.client.heartbeat.interval'] = 1000;
                return HazelcastClient.newHazelcastClient(cfg);
            }).then(function (cl) {
                client = cl;
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
                return Controller.terminateMember(cluster.id, member.uuid);
            }).then(function () {
                return Controller.startMember(cluster.id);
            }).then(function () {
                return map.put('keyx', 'valx');
            });
        });
    });



});
