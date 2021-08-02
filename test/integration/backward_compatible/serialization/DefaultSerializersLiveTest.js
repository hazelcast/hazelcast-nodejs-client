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

const Long = require('long');
const { expect } = require('chai');
const RC = require('../../RC');
const { Lang } = require('../../remote_controller/remote-controller_types');
const { Client, RestValue, UUID } = require('../../../../');
const TestUtil = require('../../../TestUtil');

describe('DefaultSerializersLiveTest', function () {

    let cluster, client;
    let map;

    before(async function () {
        cluster = await RC.createCluster(null, null);
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
        map = await client.getMap('test');
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    const getMapValueAsString = async (index) => {
        const script = 'var map = instance_0.getMap("' + map.getName() + '");\n' +
            `result = map.get("${index}").toString();\n`;
        const response = await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
        return response.result.toString();
    };

    const generateGet = (key) => {
        return 'var StringArray = Java.type("java.lang.String[]");' +
            'function foo() {' +
            '   var map = instance_0.getMap("' + map.getName() + '");' +
            '   var res = map.get("' + key + '");' +
            '   if (res.getClass().isArray()) {' +
            '       return Java.from(res);' +
            '   } else {' +
            '       return res;' +
            '   }' +
            '}' +
            'result = ""+foo();';
    };

    it('string', async function () {
        await map.put('testStringKey', 'testStringValue');
        const response = await RC.executeOnController(cluster.id, generateGet('testStringKey'), 1);
        expect(response.result.toString()).to.equal('testStringValue');
    });

    it('utf8 sample string test', async function () {
        await map.put('key', 'Iñtërnâtiônàlizætiøn');
        const response = await RC.executeOnController(cluster.id, generateGet('key'), 1);
        expect(response.result.toString()).to.equal('Iñtërnâtiônàlizætiøn');
    });

    it('number', async function () {
        await map.put('a', 23);
        const response = await RC.executeOnController(cluster.id, generateGet('a'), 1);
        expect(Number.parseInt(response.result.toString())).to.equal(23);
    });

    it('array', async function () {
        await map.put('a', ['a', 'v', 'vg']);
        const response = await RC.executeOnController(cluster.id, generateGet('a'), 1);
        expect(response.result.toString()).to.equal(['a', 'v', 'vg'].toString());
    });

    it('buffer on client', async function () {
        await map.put('foo', Buffer.from('bar'));
        const response = await map.get('foo');
        expect(Buffer.isBuffer(response)).to.be.true;
        expect(response.toString()).to.equal('bar');
    });

    it('emoji string test on client', async function () {
        await map.put('key', '1⚐中💦2😭‍🙆😔5');
        const response = await map.get('key');
        expect(response).to.equal('1⚐中💦2😭‍🙆😔5');
    });

    it('utf8 characters test on client', async function () {
        await map.put('key', '\u0040\u0041\u01DF\u06A0\u12E0\u{1D306}');
        const response = await map.get('key');
        expect(response).to.equal('\u0040\u0041\u01DF\u06A0\u12E0\u{1D306}');
    });

    it('utf8 characters test on client with surrogates', async function () {
        await map.put('key', '\u0040\u0041\u01DF\u06A0\u12E0\uD834\uDF06');
        const response = await map.get('key');
        expect(response).to.equal('\u0040\u0041\u01DF\u06A0\u12E0\u{1D306}');
    });

    it('emoji string test on RC', async function () {
        await map.put('key', '1⚐中💦2😭‍🙆😔5');
        const response = await RC.executeOnController(cluster.id, generateGet('key'), 1);
        expect(response.result.toString()).to.equal('1⚐中💦2😭‍🙆😔5');
    });

    it('utf8 characters test on RC', async function () {
        await map.put('key', '\u0040\u0041\u01DF\u06A0\u12E0\u{1D306}');
        const response = await RC.executeOnController(cluster.id, generateGet('key'), 1);
        expect(response.result.toString()).to.equal('\u0040\u0041\u01DF\u06A0\u12E0\u{1D306}');
    });

    it('utf8 characters test on RC with surrogates', async function () {
        await map.put('key', '\u0040\u0041\u01DF\u06A0\u12E0\uD834\uDF06');
        const response = await RC.executeOnController(cluster.id, generateGet('key'), 1);
        expect(response.result.toString()).to.equal('\u0040\u0041\u01DF\u06A0\u12E0\u{1D306}');
    });

    it('rest value', async function () {
        // Make sure that the object is properly de-serialized at the server
        const restValue = new RestValue();
        restValue.value = '{\'test\':\'data\'}';
        restValue.contentType = 'text/plain';

        const script = 'var map = instance_0.getMap("' + map.getName() + '");\n' +
            'var restValue = map.get("key");\n' +
            'var contentType = restValue.getContentType();\n' +
            'var value = restValue.getValue();\n' +
            'var String = Java.type("java.lang.String");\n' +
            'result = "{\\"contentType\\": \\"" + new String(contentType) + "\\", ' +
            '\\"value\\": \\"" +  new String(value) + "\\"}"\n';

        await map.put('key', restValue);
        const response = await RC.executeOnController(cluster.id, script, 1);
        const result = JSON.parse(response.result.toString());
        expect(result.contentType).to.equal(restValue.contentType);
        expect(result.value).to.equal(restValue.value);
    });

    it('UUID', async function () {
        // Make sure that the object is properly de-serialized at the server
        const uuid = new UUID(Long.fromNumber(24), Long.fromNumber(42));

        const script = 'var map = instance_0.getMap("' + map.getName() + '");\n' +
            'var uuid = map.get("key");\n' +
            'result = "\\"" + uuid.toString() + "\\"";\n';

        await map.put('key', uuid);
        const response = await RC.executeOnController(cluster.id, script, 1);
        const result = JSON.parse(response.result);
        expect(result).to.equal(uuid.toString());
    });

    it('should deserialize ArrayList', async function () {
        TestUtil.markClientVersionAtLeast(this, '4.2');
        const script = 'var map = instance_0.getMap("' + map.getName() + '");\n' +
            'var list = new java.util.ArrayList();\n' +
            'list.add(1);\n' +
            'list.add(2);\n' +
            'list.add(3);\n' +
            'map.set("key", list);\n';

        await RC.executeOnController(cluster.id, script, 1);

        const actualValue = await map.get('key');
        expect(actualValue).to.deep.equal([1, 2, 3]);
    });

    it('should deserialize LinkedList', async function () {
        TestUtil.markClientVersionAtLeast(this, '4.2');
        const script = 'var map = instance_0.getMap("' + map.getName() + '");\n' +
            'var list = new java.util.LinkedList();\n' +
            'list.add(1);\n' +
            'list.add(2);\n' +
            'list.add(3);\n' +
            'map.set("key", list);\n';

        await RC.executeOnController(cluster.id, script, 1);

        const actualValue = await map.get('key');
        expect(actualValue).to.deep.equal([1, 2, 3]);
    });

    const bigDecimalTestParams = [
        ['1.00000000000000000000001', 100000000000000000000001n, 23],
        ['1.000000000000000000000000000000000001', 1000000000000000000000000000000000001n, 36],
        // the one below has odd number of characters in hex form
        ['1.0000000000000000000000000000000001', 10000000000000000000000000000000001n, 34],
        ['-0.00000000000000000000000000000000002', -2n, 35],
        ['11111111111111111111111111111111111111122222222233333.123',
            11111111111111111111111111111111111111122222222233333123n, 3],
        ['-11111111111111111111111111111111111111122222222233333.123',
            -11111111111111111111111111111111111111122222222233333123n, 3],
        ['1.123e32', 1123n, -29],
        ['1.123e-32', 1123n, 35],
        ['-1.123e32', -1123n, -29],
        ['-1.123e-32', -1123n, 35],
        ['1.123E32', 1123n, -29],
        ['1.123E-32', 1123n, 35],
        ['-1.123E32', -1123n, -29],
        ['-1.123E-32', -1123n, 35],
    ];

    it('should deserialize BigDecimal', async function () {
        TestUtil.markClientVersionAtLeast(this, '5.0');

        let script = 'var map = instance_0.getMap("' + map.getName() + '");\n';

        bigDecimalTestParams.forEach((value, index) => {
            script += `map.set("${index}", new java.math.BigDecimal("${value[0]}"));\n`;
        });

        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);

        for (let i = 0; i < bigDecimalTestParams.length; i++) {
            const actualValue = await map.get(i.toString());

            expect(actualValue.unscaledValue).to.equal(bigDecimalTestParams[i][1]);
            expect(actualValue.scale).to.equal(bigDecimalTestParams[i][2]);
        }
    });

    it('should serialize BigDecimal correctly', async function () {
        TestUtil.markClientVersionAtLeast(this, '5.0');
        const BigDecimal = TestUtil.getBigDecimal();

        for (let i = 0; i < bigDecimalTestParams.length; i++) {
            await map.put(i.toString(), new BigDecimal(bigDecimalTestParams[i][1], bigDecimalTestParams[i][2]));
        }

        for (let i = 0; i < bigDecimalTestParams.length; i++) {
            const script = 'var map = instance_0.getMap("' + map.getName() + '");\n' +
                `result = map.get("${i}").toPlainString();\n`;
            const response = await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
            const responseString = response.result.toString();
            if (bigDecimalTestParams[i][0].includes('e') || bigDecimalTestParams[i][0].includes('E')) {
                // convert to plain string and compare, remote controller sends plain string
                expect(responseString).to.equal(BigDecimal.fromString(bigDecimalTestParams[i][0]).toString());
            } else {
                expect(responseString).to.equal(bigDecimalTestParams[i][0]);
            }
        }
    });

    // the format is [[year, month, date, hour, minute, second, optional nano], offset seconds]
    const dtParams = [
        [[2020, 10, 2, 10, 10, 22], 64800],
        [[-2020, 1, 31, 10, 10, 22, 123], 1],
        [[1e9 - 1, 10, 2, 23, 10, 22, 123], 2],
        [[-1 * (1e9 - 1), 10, 2, 0, 10, 22, 123], 1],
        [[2020, 1, 2, 10, 59, 22, 123], 1],
        [[2020, 12, 1, 10, 1, 22, 123], -64800],
        [[2020, 1, 1, 10, 10, 59, 123], 1],
        [[2020, 1, 1, 10, 10, 1, 123], 1],
        [[2020, 1, 31, 10, 10, 22, 1e9 - 1], 0],
        [[2020, 1, 31, 10, 10, 22, 0], 1],
    ];

    it('should deserialize LocalDate', async function () {
        TestUtil.markClientVersionAtLeast(this, '5.0');

        let script = 'var map = instance_0.getMap("' + map.getName() + '");\n';

        dtParams.forEach((values, index) => {
            const v = values[0];
            script += `map.set("${index}", java.time.LocalDate.of(${v[0]}, ${v[1]}, ${v[2]}));\n`;
        });

        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);

        for (let i = 0; i < dtParams.length; i++) {
            const actualValue = await map.get(i.toString());
            const param = dtParams[i][0];

            expect(actualValue.year).to.equal(param[0]);
            expect(actualValue.month).to.equal(param[1]);
            expect(actualValue.date).to.equal(param[2]);
        }
    });

    it('should serialize LocalDate correctly', async function () {
        TestUtil.markClientVersionAtLeast(this, '5.0');
        const LocalDate = TestUtil.getLocalDate();

        for (let i = 0; i < dtParams.length; i++) {
            const param = dtParams[i][0];
            await map.put(i.toString(), new LocalDate(param[0], param[1], param[2]));
        }

        for (let i = 0; i < dtParams.length; i++) {
            const param = dtParams[i][0];

            let responseString = await getMapValueAsString(i);
            if (responseString[0] === '+') {
                responseString = responseString.slice(1); // remove plus sign if exists
            }
            const yearString = param[0].toString().padStart(4, '0');
            const monthString = param[1].toString().padStart(2, '0');
            const dateString = param[2].toString().padStart(2, '0');

            expect(responseString).to.equal(`${yearString}-${monthString}-${dateString}`);
        }
    });

    it('should deserialize LocalTime', async function () {
        TestUtil.markClientVersionAtLeast(this, '5.0');

        let script = 'var map = instance_0.getMap("' + map.getName() + '");\n';

        dtParams.forEach((values, index) => {
            const v = values[0];
            if (v.length === 7) {
                script += `map.set("${index}", java.time.LocalTime.of(${v[3]}, ${v[4]}, ${v[5]}, ${v[6]}));\n`;
            } else {
                script += `map.set("${index}", java.time.LocalTime.of(${v[3]}, ${v[4]}, ${v[5]}));\n`;
            }
        });

        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);

        for (let i = 0; i < dtParams.length; i++) {
            const actualValue = await map.get(i.toString());
            const param = dtParams[i][0];

            expect(actualValue.hour).to.equal(param[3]);
            expect(actualValue.minute).to.equal(param[4]);
            expect(actualValue.second).to.equal(param[5]);
            if (param.length === 7) {
                expect(actualValue.nano).to.equal(param[6]);
            } else {
                expect(actualValue.nano).to.equal(0);
            }
        }
    });

    it('should serialize LocalTime correctly', async function () {
        TestUtil.markClientVersionAtLeast(this, '5.0');
        const LocalTime = TestUtil.getLocalTime();
        for (let i = 0; i < dtParams.length; i++) {
            const param = dtParams[i][0];

            let localTime;
            if (param.length === 7) {
                localTime = new LocalTime(param[3], param[4], param[5], param[6]);
            } else {
                localTime = new LocalTime(param[3], param[4], param[5], 0);
            }
            await map.put(i.toString(), localTime);
        }

        for (let i = 0; i < dtParams.length; i++) {
            const param = dtParams[i][0];

            const responseString = await getMapValueAsString(i);

            const hourString = param[3].toString().padStart(2, '0');
            const minuteString = param[4].toString().padStart(2, '0');
            const secondString = param[5].toString().padStart(2, '0');

            if (param.length === 6 || (param.length === 7 && param[6] === 0)) {
                expect(responseString).to.equal(`${hourString}:${minuteString}:${secondString}`);
            } else {
                const nanoString = param[6].toString().padStart(9, '0');
                expect(responseString).to.equal(`${hourString}:${minuteString}:${secondString}.${nanoString}`);
            }
        }
    });

    it('should deserialize LocalDateTime', async function () {
        TestUtil.markClientVersionAtLeast(this, '5.0');

        let script = 'var map = instance_0.getMap("' + map.getName() + '");\n';

        dtParams.forEach((values, index) => {
            const v = values[0];
            if (v.length === 7) {
                script += `map.set("${index}", ` +
                    `java.time.LocalDateTime.of(${v[0]}, ${v[1]}, ${v[2]}, ${v[3]}, ${v[4]}, ${v[5]}, ${v[6]}));\n`;
            } else {
                script += `map.set("${index}", ` +
                    `java.time.LocalDateTime.of(${v[0]}, ${v[1]}, ${v[2]}, ${v[3]}, ${v[4]}, ${v[5]}));\n`;
            }
        });

        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);

        for (let i = 0; i < dtParams.length; i++) {
            const actualValue = await map.get(i.toString());
            const param = dtParams[i][0];

            expect(actualValue.localDate.year).to.equal(param[0]);
            expect(actualValue.localDate.month).to.equal(param[1]);
            expect(actualValue.localDate.date).to.equal(param[2]);
            expect(actualValue.localTime.hour).to.equal(param[3]);
            expect(actualValue.localTime.minute).to.equal(param[4]);
            expect(actualValue.localTime.second).to.equal(param[5]);
            if (param.length === 7) {
                expect(actualValue.localTime.nano).to.equal(param[6]);
            } else {
                expect(actualValue.localTime.nano).to.equal(0);
            }
        }
    });

    it('should serialize LocalDateTime correctly', async function () {
        TestUtil.markClientVersionAtLeast(this, '5.0');
        const LocalDateTime = TestUtil.getLocalDateTime();

        for (let i = 0; i < dtParams.length; i++) {
            const param = dtParams[i][0];

            let localTime;
            if (param.length === 7) {
                localTime = LocalDateTime.from(param[0], param[1], param[2], param[3], param[4], param[5], param[6]);
            } else {
                localTime = LocalDateTime.from(param[0], param[1], param[2], param[3], param[4], param[5], 0);
            }
            await map.put(i.toString(), localTime);
        }

        for (let i = 0; i < dtParams.length; i++) {
            const param = dtParams[i][0];

            let responseString = await getMapValueAsString(i);
            if (responseString[0] === '+') {
                responseString = responseString.slice(1); // remove plus sign if exists
            }
            const yearString = param[0].toString().padStart(4, '0');
            const monthString = param[1].toString().padStart(2, '0');
            const dateString = param[2].toString().padStart(2, '0');

            const hourString = param[3].toString().padStart(2, '0');
            const minuteString = param[4].toString().padStart(2, '0');
            const secondString = param[5].toString().padStart(2, '0');

            if (param.length === 6 || (param.length === 7 && param[6] === 0)) {
                expect(responseString).to.equal(`${yearString}-${monthString}-${dateString}` +
                    `T${hourString}:${minuteString}:${secondString}`);
            } else {
                const nanoString = param[6].toString().padStart(9, '0');
                expect(responseString).to.equal(`${yearString}-${monthString}-${dateString}` +
                    `T${hourString}:${minuteString}:${secondString}.${nanoString}`);
            }
        }
    });

    it('should deserialize OffsetDateTime', async function () {
        TestUtil.markClientVersionAtLeast(this, '5.0');

        let script = 'var map = instance_0.getMap("' + map.getName() + '");\n';

        dtParams.forEach((values, index) => {
            const v = values[0];
            const offsetSeconds = values[1];
            if (v.length === 7) {
                script += `map.set("${index}", ` +
                    `java.time.OffsetDateTime.of(${v[0]}, ${v[1]}, ${v[2]}, ${v[3]}, ${v[4]}, ${v[5]}, ${v[6]},` +
                    `java.time.ZoneOffset.ofTotalSeconds(${offsetSeconds})));\n`;
            } else {
                script += `map.set("${index}", ` +
                    `java.time.OffsetDateTime.of(${v[0]}, ${v[1]}, ${v[2]}, ${v[3]}, ${v[4]}, ${v[5]}, 0,` +
                    `java.time.ZoneOffset.ofTotalSeconds(${offsetSeconds})));\n`;
            }
        });

        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);

        for (let i = 0; i < dtParams.length; i++) {
            const actualValue = await map.get(i.toString());
            const param = dtParams[i][0];

            expect(actualValue.localDateTime.localDate.year).to.equal(param[0]);
            expect(actualValue.localDateTime.localDate.month).to.equal(param[1]);
            expect(actualValue.localDateTime.localDate.date).to.equal(param[2]);
            expect(actualValue.localDateTime.localTime.hour).to.equal(param[3]);
            expect(actualValue.localDateTime.localTime.minute).to.equal(param[4]);
            expect(actualValue.localDateTime.localTime.second).to.equal(param[5]);
            if (param.length === 7) {
                expect(actualValue.localDateTime.localTime.nano).to.equal(param[6]);
            } else {
                expect(actualValue.localDateTime.localTime.nano).to.equal(0);
            }
        }
    });

    it('should serialize OffsetDateTime correctly', async function () {
        TestUtil.markClientVersionAtLeast(this, '5.0');
        const getTimezoneOffsetFromSeconds = TestUtil.getDateTimeUtil().getTimezoneOffsetFromSeconds;
        const OffsetDateTime = TestUtil.getOffsetDateTime();

        for (let i = 0; i < dtParams.length; i++) {
            const params = dtParams[i][0];
            const offsetSeconds = dtParams[i][1];

            let localTime;
            if (params.length === 7) {
                localTime = OffsetDateTime.from(
                    params[0], params[1], params[2], params[3], params[4], params[5], params[6], offsetSeconds
                );
            } else {
                localTime = OffsetDateTime.from(
                    params[0], params[1], params[2], params[3], params[4], params[5], 0, offsetSeconds
                );
            }
            await map.put(i.toString(), localTime);
        }

        for (let i = 0; i < dtParams.length; i++) {
            const params = dtParams[i][0];
            const offsetSeconds = dtParams[i][1];
            const timezoneOffsetString = getTimezoneOffsetFromSeconds(offsetSeconds);

            let responseString = await getMapValueAsString(i);
            if (responseString[0] === '+') {
                responseString = responseString.slice(1); // remove plus sign if exists
            }

            const yearString = params[0].toString().padStart(4, '0');
            const monthString = params[1].toString().padStart(2, '0');
            const dateString = params[2].toString().padStart(2, '0');

            const hourString = params[3].toString().padStart(2, '0');
            const minuteString = params[4].toString().padStart(2, '0');
            const secondString = params[5].toString().padStart(2, '0');

            // java sends offset as hh:mm:ss, but ISO format is hh:mm, so we will do a startsWith check
            if (params.length === 6 || (params.length === 7 && params[6] === 0)) {
                expect(responseString).to.satisfy(msg => msg.startsWith(`${yearString}-${monthString}-${dateString}` +
                    `T${hourString}:${minuteString}:${secondString}${timezoneOffsetString}`));
            } else {
                const nanoString = params[6].toString().padStart(9, '0');
                expect(responseString).to.satisfy(msg => msg.startsWith(`${yearString}-${monthString}-${dateString}` +
                    `T${hourString}:${minuteString}:${secondString}.${nanoString}${timezoneOffsetString}`));
            }
        }
    });
});
