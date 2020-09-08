/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

const UUID = require('../../lib/core/UUID').UUID;
const expect = require('chai').expect;
const Long = require('long');

describe('UuidTest', function () {

    it('with small most significant high bits', function () {
        const uuid = new UUID(new Long(-99999, 1), new Long(213231, -213321));
        // Should pad first part with zeros
        expect(uuid.toString()).to.equal("00000001-fffe-7961-fffc-beb7000340ef");
    });

    it('with negative most significant high bits', function () {
        const uuid = new UUID(new Long(123, -123), new Long(-213231, 213321));
        expect(uuid.toString()).to.equal("ffffff85-0000-007b-0003-4149fffcbf11");
    });

    it('with small most significant low bits', function () {
        const uuid = new UUID(new Long(941112, 91233112), new Long(213231, -213321));
        // Should pad second part with zeros
        expect(uuid.toString()).to.equal("05701b58-000e-5c38-fffc-beb7000340ef");

        const smallerUuid = new UUID(new Long(1112, 91233112), new Long(213231, -213321));
        // Should also pad third part with zeros
        expect(smallerUuid.toString()).to.equal("05701b58-0000-0458-fffc-beb7000340ef");
    });

    it('with negative most significant low bits', function () {
        const uuid = new UUID(new Long(-941112, 91233112), new Long(213231, -213321));
        expect(uuid.toString()).to.equal("05701b58-fff1-a3c8-fffc-beb7000340ef");
    });

    it('with small least significant high bits', function () {
        const uuid = new UUID(new Long(-99999, 1), new Long(34561234, 912333));
        // Should pad fourth part with zeros
        expect(uuid.toString()).to.equal("00000001-fffe-7961-000d-ebcd020f5cd2");

        const smallerUuid = new UUID(new Long(-99999, 1), new Long(34561234, 33));
        // Should also pad beginning(first 4 chars) of fifth part with zeros
        expect(smallerUuid.toString()).to.equal("00000001-fffe-7961-0000-0021020f5cd2");
    });

    it('with negative least significant high bits', function () {
        const uuid = new UUID(new Long(42, -42), new Long(56789123, -1));
        expect(uuid.toString()).to.equal("ffffffd6-0000-002a-ffff-ffff03628883");
    });

    it('with small least significant low bits', function () {
        const uuid = new UUID(new Long(56701010, -9123123), new Long(99, -42));
        // Should pad end(last 8 chars) of fifth part with zeros
        expect(uuid.toString()).to.equal("ff74cacd-0361-3052-ffff-ffd600000063");
    });

    it('with negative least significant low bits', function () {
        const uuid = new UUID(new Long(-56701010, 9123123), new Long(-99, 42));
        expect(uuid.toString()).to.equal("008b3533-fc9e-cfae-0000-002affffff9d");
    });
});
