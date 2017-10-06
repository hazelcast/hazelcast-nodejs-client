var Controller = require('./RC');
var expect = require('chai').expect;
var HazelcastClient = require('../.').Client;
var Config = require('../.').Config;
var Util = require('./Util');

describe('Client reconnect', function () {

    var cluster;
    var client;

    afterEach(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    it('member restarts, while map.put in progress', function () {
        this.timeout(4000);
        var member;
        var map;
        return Controller.createCluster(null, null).then(function(cl) {
            cluster = cl;
            clusterId = cluster.id;
            return Controller.startMember(cluster.id);
        }).then(function(m) {
            member = m;
            var cfg = new Config.ClientConfig();
            cfg.properties['hazelcast.client.heartbeat.interval'] = 1000;
            cfg.properties['hazelcast.client.heartbeat.timeout'] = 3000;
            return HazelcastClient.newHazelcastClient(cfg);
        }).then(function(cl) {
            client = cl;
            map = client.getMap('test');
        }).then(function() {
            return Controller.terminateMember(cluster.id, member.uuid);
        }).then(function() {
            return Controller.startMember(cluster.id);
        }).then(function() {
            return map.put('testkey', 'testvalue');
        }).then(function() {
            return map.get('testkey');
        }).then(function (val) {
            return expect(val).to.equal('testvalue');
        })
    });

    it('member restarts, while map.put in progress 2', function () {
        this.timeout(4000);
        var member;
        var map;
        return Controller.createCluster(null, null).then(function(cl) {
            cluster = cl;
            clusterId = cluster.id;
            return Controller.startMember(cluster.id);
        }).then(function(m) {
            member = m;
            var cfg = new Config.ClientConfig();
            cfg.properties['hazelcast.client.heartbeat.interval'] = 1000;
            cfg.properties['hazelcast.client.heartbeat.timeout'] = 3000;
            return HazelcastClient.newHazelcastClient(cfg);
        }).then(function(cl) {
            client = cl;
            map = client.getMap('test');
        }).then(function() {
            return Controller.terminateMember(cluster.id, member.uuid);
        }).then(function() {
            map.put('testkey', 'testvalue');
        }).then(function() {
            return Controller.startMember(cluster.id);
        }).then(function() {
            return map.get('testkey');
        }).then(function (val) {
            return expect(val).to.equal('testvalue');
        })
    });

    it('create proxy while member is down, member comes back', function () {
        this.timeout(4000);
        var member;
        var map;
        return Controller.createCluster(null, null).then(function(cl) {
            cluster = cl;
            clusterId = cluster.id;
            return Controller.startMember(cluster.id);
        }).then(function(m) {
            member = m;
            var cfg = new Config.ClientConfig();
            cfg.properties['hazelcast.client.heartbeat.interval'] = 1000;
            cfg.properties['hazelcast.client.heartbeat.timeout'] = 3000;
            return HazelcastClient.newHazelcastClient(cfg);
        }).then(function(cl) {
            client = cl;
            return Controller.terminateMember(cluster.id, member.uuid);
        }).then(function() {
            map = client.getMap('test');
        }).then(function() {
            return Controller.startMember(cluster.id);
        }).then(function() {
            return map.put('testkey', 'testvalue');
        }).then(function() {
            return map.get('testkey');
        }).then(function (val) {
            return expect(val).to.equal('testvalue');
        })
    });

});
