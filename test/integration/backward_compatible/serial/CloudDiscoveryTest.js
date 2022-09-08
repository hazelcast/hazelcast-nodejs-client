'use strict';

const { expect } = require('chai');
const RC = require('../../RC');
const TestUtil = require('../../../TestUtil');
const { AssertionError } = require('assert');
const { HazelcastError } = require('../../../../lib/core/HazelcastError');
const { HazelcastClient} = require("../../../../lib/HazelcastClient");
const { Client } = require("../../../../lib/index");
const {FailoverConfigBuilder} = require("../../../../lib/config/FailoverConfigBuilder");
describe('Invalid Cluster Discovery Token Test', function () {
    let cluster;
    let client;
    let cfg;

    const testFactory = new TestUtil.TestFactory();

    it('invalid_discovery_token', async function () {
        cfg = {network: {hazelcastCloud: {discoveryToken: 'invalid_discovery_token'}}};

        try {
            testFactory.newHazelcastClientForSerialTests(cfg);
        } catch (err) {
            console.log(err);
            expect(err).to.be.instanceof(HazelcastError);
        }
    });

    it('invalid_discovery_token_with_anycluster', async function () {
        cfg = {
            network: {
                hazelcastCloud: {
                    discoveryToken: 'invalid_discovery_token',
                }
            }
        }
        try {
            client = await HazelcastClient.newHazelcastClient(cfg);
        }
        catch (err) {
            console.log(err);
            expect(err).to.be.instanceof(HazelcastError);
        }
    });

});
