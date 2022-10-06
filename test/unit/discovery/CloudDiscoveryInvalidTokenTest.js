'use strict';

const { expect } = require('chai');
const {HazelcastCloudDiscovery} = require("../../../lib/discovery/HazelcastCloudDiscovery");
const { HazelcastError } = require('../../../lib');
const { ClientConfigImpl } = require('../../../lib/config/Config');
const {getRejectionReasonOrThrow} = require("../../TestUtil");

describe('Cloud Discovery Invalid Token Test', function () {
    it('Cloud Discovery should throw proper error with an invalid token', async function () {
        const clientConfig = new ClientConfigImpl();
        const cloudDiscovery = new HazelcastCloudDiscovery(
            clientConfig.properties['hazelcast.client.cloud.url'], 2 << 31
        );

        try {
            const error = await getRejectionReasonOrThrow(cloudDiscovery.callService.bind(cloudDiscovery));
            expect(error).to.be.instanceof(HazelcastError);
            expect(error.message).to.include('discovery token is invalid');
        } catch (err) {
            console.log(err);
        }

    });
});
