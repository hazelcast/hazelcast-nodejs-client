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

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const RC = require('./RC');
const { Client } = require('../../');
const { UuidUtil } = require('../../lib/util/UuidUtil');
const { AddressImpl } = require('../../lib/core/Address');
const { MemberImpl } = require('../../lib/core/Member');
const { EndpointQualifier, ProtocolType } = require('../../lib/core/EndpointQualifier');

/**
 * Tests address translation done by `ConnectionManager`.
 */
describe('ConnectionManagerTranslateTest', function () {

    const PROPERTY_DISCOVERY_PUBLIC_IP_ENABLED = 'hazelcast.discovery.public.ip.enabled';
    const REACHABLE_HOST = '127.0.0.1';
    const UNREACHABLE_HOST = '192.168.0.1';

    let cluster;
    let client;

    function member({ uuid, internalHost, publicHost } = {}) {
        const member = new MemberImpl();
        member.uuid = uuid ? uuid : UuidUtil.generate();
        member.address = new AddressImpl(internalHost, 5701);
        member.addressMap = new Map();
        member.addressMap.set(
            new EndpointQualifier(ProtocolType.CLIENT, 'public'),
            new AddressImpl(publicHost, 5701)
        );
        return member;
    }

    before(async function () {
        cluster = await RC.createCluster(null, null);
        await RC.startMember(cluster.id);
    });

    after(async function () {
        await RC.terminateCluster(cluster.id);
    });

    afterEach(async function () {
        await client.shutdown();
    });

    it('should use existing connection when connecting to member', async function () {
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            network: {
                connectionTimeout: 1000
            }
        });

        const connectionRegistry = client.connectionRegistry;
        const fakeMember = member();
        const fakeConn = {};
        // inject fake connection
        connectionRegistry.activeConnections.set(fakeMember.uuid.toString(), fakeConn);

        const conn = await client.connectionManager.getOrConnectToMember(fakeMember);
        expect(conn).to.be.equal(fakeConn);

        // clean up fake connection
        connectionRegistry.activeConnections.delete(fakeMember.uuid.toString());
    });

    it('should translate and connect when internal address is not reachable and property set to true', async function () {
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            network: {
                connectionTimeout: 1000
            },
            properties: {
                [PROPERTY_DISCOVERY_PUBLIC_IP_ENABLED]: true
            }
        });

        const connectionManager = client.getConnectionManager();
        const conn = await connectionManager.getOrConnectToMember(
            member({ internalHost: UNREACHABLE_HOST, publicHost: REACHABLE_HOST })
        );
        expect(conn).to.be.not.null;
    });

    it('should not translate and fail when internal address is not reachable and property set to false', async function () {
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            network: {
                connectionTimeout: 1000
            },
            properties: {
                [PROPERTY_DISCOVERY_PUBLIC_IP_ENABLED]: false
            }
        });

        const connectionManager = client.getConnectionManager();
        await expect(connectionManager.getOrConnectToMember(
            member({ internalHost: UNREACHABLE_HOST, publicHost: REACHABLE_HOST })
        )).to.be.rejected;
    });
});
