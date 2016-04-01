var RemoteController = require('hazelcast-remote-controller');
var Q = require('q');

var controller = new RemoteController('localhost', 9701);

function createCluster(hzVersion, config) {
    var deferred = Q.defer();
    controller.createCluster(hzVersion, config, function(err, cluster) {
        if (err) return deferred.reject(err);
        return deferred.resolve(cluster);
    });
    return deferred.promise;
}

function startMember(clusterId) {
    var deferred = Q.defer();
    controller.startMember(clusterId, function(err, member) {
        if (err) return deferred.reject(err);
        return deferred.resolve(member);
    });
    return deferred.promise;
}

function exit() {
    var deferred = Q.defer();
    controller.exit(function(err, res) {
        if (err) return deferred.reject(err);
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function shutdownMember(clusterId, memberUuid) {
    var deferred = Q.defer();
    controller.shutdownMember(clusterId, memberUuid, function(err, res) {
        if (err) return deferred.reject(err);
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function shutdownCluster(clusterId) {
    var deferrred = Q.defer();
    controller.shutdownCluster(clusterId, function (err, res) {
        if (err) return deferrred.reject(err);
        return deferrred.resolve(res);
    });
    return deferrred.promise;
}

exports.exit = exit;
exports.createCluster = createCluster;
exports.startMember = startMember;
exports.shutdownMember = shutdownMember;
exports.shutdownCluster = shutdownCluster;
