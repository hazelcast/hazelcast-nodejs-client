/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

const thrift = require('thrift');
const RemoteController = require('./RemoteController');

function HzRemoteController() {
    const transport = thrift.TBufferedTransport();
    const protocol = thrift.TBinaryProtocol();

    const connection = thrift.createConnection('localhost', 9701, {
        transport: transport,
        protocol: protocol
    });

    connection.on('error', (err) => {
        console.log(err);
    });

    this.client = thrift.createClient(RemoteController, connection);
}

HzRemoteController.prototype.ping = function(callback) {
    return this.client.ping(callback);
};

HzRemoteController.prototype.clean = function(callback) {
    return this.client.clean(callback);
};

HzRemoteController.prototype.exit = function(callback) {
    return this.client.exit(callback);
};

HzRemoteController.prototype.createCluster = function(hzVersion, xmlConfig, callback) {
    return this.client.createCluster(hzVersion, xmlConfig, callback);
};

HzRemoteController.prototype.createClusterKeepClusterName = function(hzVersion, xmlConfig, callback) {
    return this.client.createClusterKeepClusterName(hzVersion, xmlConfig, callback);
};

HzRemoteController.prototype.startMember = function(clusterId, callback) {
    return this.client.startMember(clusterId, callback);
};

HzRemoteController.prototype.shutdownMember = function(clusterId, memberId, callback) {
    return this.client.shutdownMember(clusterId, memberId, callback);
};

HzRemoteController.prototype.terminateMember = function(clusterId, memberId, callback) {
    return this.client.terminateMember(clusterId, memberId, callback);
};

HzRemoteController.prototype.shutdownCluster = function(clusterId, callback) {
    return this.client.shutdownCluster(clusterId, callback);
};

HzRemoteController.prototype.terminateCluster = function(clusterId, callback) {
    return this.client.terminateCluster(clusterId, callback);
};

HzRemoteController.prototype.splitMemberFromCluster = function(memberId, callback) {
    return this.client.splitMemberFromCluster(memberId, callback);
};

HzRemoteController.prototype.mergeMemberToCluster = function(clusterId, memberId, callback) {
    return this.client.mergeMemberToCluster(clusterId, memberId, callback);
};

HzRemoteController.prototype.executeOnController = function(clusterId, script, lang, callback) {
    return this.client.executeOnController(clusterId, script, lang, callback);
};

module.exports = HzRemoteController;
