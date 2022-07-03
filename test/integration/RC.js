/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const RC = require('./remote_controller/Controller');
const { deferredPromise } = require('../../lib/util/Util');

const controller = new RC();

function createCluster(hzVersion, config) {
    const deferred = deferredPromise();
    controller.createCluster(hzVersion, config, (err, cluster) => {
        if (err) {
            return deferred.reject(err);
        }
        return deferred.resolve(cluster);
    });
    return deferred.promise;
}

function createClusterKeepClusterName(hzVersion, config) {
    const deferred = deferredPromise();
    controller.createClusterKeepClusterName(hzVersion, config, (err, cluster) => {
        if (err) {
            return deferred.reject(err);
        }
        return deferred.resolve(cluster);
    });
    return deferred.promise;
}

function startMember(clusterId) {
    const deferred = deferredPromise();
    controller.startMember(clusterId, (err, member) => {
        if (err) {
            return deferred.reject(err);
        }
        return deferred.resolve(member);
    });
    return deferred.promise;
}

function exit() {
    const deferred = deferredPromise();
    controller.exit((err, res) => {
        if (err) {
            return deferred.reject(err);
        }
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function shutdownMember(clusterId, memberUuid) {
    const deferred = deferredPromise();
    controller.shutdownMember(clusterId, memberUuid, (err, res) => {
        if (err) {
            return deferred.reject(err);
        }
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function shutdownCluster(clusterId) {
    const deferred = deferredPromise();
    controller.shutdownCluster(clusterId, (err, res) => {
        if (err) {
            return deferred.reject(err);
        }
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function terminateMember(clusterId, memberUuid) {
    const deferred = deferredPromise();
    controller.terminateMember(clusterId, memberUuid, (err, res) => {
        if (err) {
            return deferred.reject(err);
        }
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function terminateCluster(clusterId) {
    const deferred = deferredPromise();
    controller.terminateCluster(clusterId, (err, res) => {
        if (err) {
            return deferred.reject(err);
        }
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function executeOnController(clusterId, script, lang) {
    const deferred = deferredPromise();
    controller.executeOnController(clusterId, script, lang, (err, res) => {
        if (err) {
            return deferred.reject(err);
        }
        if (res.success === false) {
            return deferred.reject(res.message);
        }
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function loginToHazelcastCloudUsingEnvironment() {
    const deferred = deferredPromise();
    controller.loginToHazelcastCloudUsingEnvironment((err, res) => {
        if (err) {
            return deferred.reject(err);
        }
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function loginToHazelcastCloud(uri, apiKey, apiSecret) {
    const deferred = deferredPromise();
    controller.loginToHazelcastCloud(uri, apiKey, apiSecret, (err, res) => {
        if (err) {
            return deferred.reject(err);
        }
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function getHazelcastCloudCluster(clusterId) {
    const deferred = deferredPromise();
    controller.getHazelcastCloudCluster(clusterId, (err, res) => {
        if (err) {
            return deferred.reject(err);
        }
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function createHazelcastCloudStandardCluster(hzVersion, isTlsEnabled) {
    const deferred = deferredPromise();
    controller.createHazelcastCloudStandardCluster(hzVersion, isTlsEnabled, (err, res) =>{
        if (err)
        {
            return deferred.reject(err);
        }
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function setHazelcastCloudClusterMemberCount(clusterId, totalMemberCount) {
    const deferred = deferredPromise();
    controller.setHazelcastCloudClusterMemberCount(clusterId, totalMemberCount, (err, res) =>{
        if (err)
        {
            return deferred.reject(err);
        }
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function stopHazelcastCloudCluster(clusterId) {
    const deferred = deferredPromise();
    controller.stopHazelcastCloudCluster(clusterId, (err, res) =>{
        if (err)
        {
            return deferred.reject(err);
        }
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function resumeHazelcastCloudCluster(clusterId) {
    const deferred = deferredPromise();
    controller.resumeHazelcastCloudCluster(clusterId, (err, res) =>{
        if (err)
        {
            return deferred.reject(err);
        }
        return deferred.resolve(res);
    });
    return deferred.promise;
}

function deleteHazelcastCloudCluster(clusterId) {
    const deferred = deferredPromise();
    controller.deleteHazelcastCloudCluster(clusterId, (err, res) =>{
        if (err)
        {
            return deferred.reject(err);
        }
        return deferred.resolve(res);
    });
    return deferred.promise;
}

exports.exit = exit;
exports.createCluster = createCluster;
exports.createClusterKeepClusterName = createClusterKeepClusterName;
exports.startMember = startMember;
exports.shutdownMember = shutdownMember;
exports.shutdownCluster = shutdownCluster;
exports.executeOnController = executeOnController;
exports.terminateMember = terminateMember;
exports.terminateCluster = terminateCluster;
exports.loginToHazelcastCloudUsingEnvironment = loginToHazelcastCloudUsingEnvironment;
exports.loginToHazelcastCloud = loginToHazelcastCloud;
exports.getHazelcastCloudCluster = getHazelcastCloudCluster;
exports.createHazelcastCloudStandardCluster = createHazelcastCloudStandardCluster;
exports.setHazelcastCloudClusterMemberCount = setHazelcastCloudClusterMemberCount;
exports.stopHazelcastCloudCluster = stopHazelcastCloudCluster;
exports.resumeHazelcastCloudCluster = resumeHazelcastCloudCluster;
exports.deleteHazelcastCloudCluster = deleteHazelcastCloudCluster;
