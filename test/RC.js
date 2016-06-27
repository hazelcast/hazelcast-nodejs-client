var RemoteController = require('hazelcast-remote-controller');
var Promise = require('bluebird');

var controller = new RemoteController('localhost', 9701);

function createCluster(hzVersion, config) {
    var deferred = Promise.defer();
    controller.createCluster(hzVersion, config, function(err, cluster) {
        if (err) return deferred.reject(err);
        return deferred.resolve(cluster);
    });
    return deferred.promise;
}

function startMember(clusterId) {
    var deferred = Promise.defer();
    controller.startMember(clusterId, function(err, member) {
        if (err) return deferred.reject(err);
        return deferred.resolve(member);
    });
    return deferred.promise;
}

function exit() {
    var deferred = Promise.defer();
    controller.exit(function(err, res) {
        if (err) return deferred.reject(err);
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function shutdownMember(clusterId, memberUuid) {
    var deferred = Promise.defer();
    controller.shutdownMember(clusterId, memberUuid, function(err, res) {
        if (err) return deferred.reject(err);
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function shutdownCluster(clusterId) {
    var deferrred = Promise.defer();
    controller.shutdownCluster(clusterId, function (err, res) {
        if (err) return deferrred.reject(err);
        return deferrred.resolve(res);
    });
    return deferrred.promise;
}

function terminateMember(clusterId, memberUuid) {
    var deferred = Promise.defer();
    controller.terminateMember(clusterId, memberUuid, function(err, res) {
        if (err) return deferred.reject(err);
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function executeOnController(clusterId, script, lang) {
    var deferred = Promise.defer();
    controller.executeOnController(clusterId, script, lang, function(err, res) {
        if (err) return deferred.reject(err);
        if (res.success === false) return deferred.reject(res.message);
        return deferred.resolve(res);
    });
    return deferred.promise;
}

exports.exit = exit;
exports.createCluster = createCluster;
exports.startMember = startMember;
exports.shutdownMember = shutdownMember;
exports.shutdownCluster = shutdownCluster;
exports.executeOnController = executeOnController;
exports.terminateMember = terminateMember;
