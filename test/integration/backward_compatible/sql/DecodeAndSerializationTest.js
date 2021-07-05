/* eslint-disable mocha/no-skipped-tests */
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

const { Lang } = require('../../remote_controller/remote-controller_types');
const RC = require('../../RC');
const TestUtil = require('../../../TestUtil');
const { Client } = require('../../../../');

const chai = require('chai');
const long = require('long');

chai.should();

class Student {
    constructor(age, height) {
        this.age = age;
        this.height = height;
        this.factoryId = 666;
        this.classId = 1;
    }

    readPortable(reader) {
        this.age = reader.readLong('age');
        this.height = reader.readFloat('height');
    }

    writePortable(writer) {
        writer.writeLong('age', this.age);
        writer.writeFloat('height', this.height);
    }
}

const getSqlColumnType = () => {
    const { SqlColumnType } = require('../../../../lib/sql/SqlColumnMetadata');
    return SqlColumnType;
};

const getDatetimeUtil = () => {
    return require('../../../../lib/util/DatetimeUtil');
};

const portableFactory = (classId) => {
    if (classId === 1) {
        return new Student();
    }
    return null;
};

describe('Decode/Serialize test', function () {
    let client;
    let cluster;
    let someMap;
    let mapName;

    const validateResults = (rows, expectedKeys, expectedValues) => {
        rows.length.should.be.eq(expectedValues.length);

        for (let i = 0; i < rows.length; i++) {
            rows[i]['this'].should.be.eq(expectedValues[i]);
            rows[i]['__key'].should.be.eq(expectedKeys[i]);
        }
    };

    before(async function () {
        TestUtil.markClientVersionAtLeast(this, '4.2');
        cluster = await RC.createCluster(null, null);
        await RC.startMember(cluster.id);
    });

    const basicSetup = async (testFn) => {
        client = await Client.newHazelcastClient({
            clusterName: cluster.id
        });
        TestUtil.markServerVersionAtLeast(testFn, client, '4.2');
        mapName = TestUtil.randomString(10);
        someMap = await client.getMap(mapName);
        await someMap.addIndex({
            type: 'SORTED',
            attributes: ['__key']
        });
    };

    afterEach(async function () {
        if (someMap) {
            await someMap.clear();
        }
        if (client) {
            await client.shutdown();
        }
    });

    after(async function () {
        if (cluster) {
            await RC.terminateCluster(cluster.id);
        }
    });

    it('should be able to decode/serialize VARCHAR', async function () {
        const SqlColumnType = getSqlColumnType();
        await basicSetup(this);
        const script =
            `
            var map = instance_0.getMap("${mapName}");
            for (var key = 0; key < 10; key++) {
                map.set(new java.lang.Integer(key), new java.lang.String(key.toString()));
            }
        `;

        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
        const result = client.getSqlService().execute(
            `SELECT * FROM ${mapName} WHERE this = ? OR this = ? ORDER BY __key ASC`, ['7', '2']
        );
        const rowMetadata = await result.getRowMetadata();
        rowMetadata.getColumn(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.VARCHAR);

        const rows = [];

        for await (const row of result) {
            rows.push(row);
        }

        const expectedValues = ['2', '7'];
        const expectedKeys = [2, 7];

        validateResults(rows, expectedKeys, expectedValues);
    });
    it('should be able to decode/serialize BOOLEAN', async function () {
        const SqlColumnType = getSqlColumnType();
        await basicSetup(this);
        const script =
            `
            var map = instance_0.getMap("${mapName}");
            for (var key = 0; key < 10; key++) {
                map.set(new java.lang.Integer(key), new java.lang.Boolean(key % 2 == 0));
            }
        `;
        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
        const result = client.getSqlService().execute(`SELECT * FROM ${mapName} WHERE this = ? ORDER BY __key ASC`, [true]);
        const rowMetadata = await result.getRowMetadata();
        rowMetadata.getColumn(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.BOOLEAN);

        const rows = [];

        for await (const row of result) {
            rows.push(row);
        }

        const expectedKeys = [0, 2, 4, 6, 8];
        const expectedValues = [true, true, true, true, true];

        validateResults(rows, expectedKeys, expectedValues);
    });
    it('should be able to decode/serialize TINYINT', async function () {
        const SqlColumnType = getSqlColumnType();
        await basicSetup(this);
        const script =
            `
            var map = instance_0.getMap("${mapName}");
            for (var key = 0; key < 10; key++) {
                map.set(new java.lang.Integer(key), new java.lang.Byte(key * 2));
            }
        `;
        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
        const result = client.getSqlService().execute(
            `SELECT * FROM ${mapName} WHERE this > ? AND this < ? ORDER BY __key ASC`,
            [long.fromNumber(10), long.fromNumber(16)]
        );
        const rowMetadata = await result.getRowMetadata();
        rowMetadata.getColumn(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.TINYINT);

        const rows = [];

        for await (const row of result) {
            rows.push(row);
        }

        const expectedValues = [12, 14];
        const expectedKeys = [6, 7];

        validateResults(rows, expectedKeys, expectedValues);
    });
    it('should be able to decode/serialize SMALLINT', async function () {
        const SqlColumnType = getSqlColumnType();
        await basicSetup(this);
        const script =
            `
            var map = instance_0.getMap("${mapName}");
            for (var key = 0; key < 10; key++) {
                map.set(new java.lang.Integer(key), new java.lang.Short(key * 2));
            }
        `;
        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
        const result = client.getSqlService().execute(
            `SELECT * FROM ${mapName} WHERE this > ? AND this < ? ORDER BY __key ASC`,
            [long.fromNumber(8), long.fromNumber(16)]
        );
        const rowMetadata = await result.getRowMetadata();
        rowMetadata.getColumn(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.SMALLINT);

        const rows = [];

        for await (const row of result) {
            rows.push(row);
        }

        const expectedValues = [10, 12, 14];
        const expectedKeys = [5, 6, 7];

        validateResults(rows, expectedKeys, expectedValues);
    });
    it('should be able to decode/serialize INTEGER', async function () {
        const SqlColumnType = getSqlColumnType();
        await basicSetup(this);
        const script =
            `
            var map = instance_0.getMap("${mapName}");
            for (var key = 0; key < 10; key++) {
                map.set(new java.lang.Integer(key), new java.lang.Integer(key * 2));
            }
        `;
        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
        const result = client.getSqlService().execute(
            `SELECT * FROM ${mapName} WHERE this > ? AND this < ? ORDER BY __key ASC`,
            [long.fromNumber(10), long.fromNumber(20)]
        );
        const rowMetadata = await result.getRowMetadata();
        rowMetadata.getColumn(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.INTEGER);

        const rows = [];

        for await (const row of result) {
            rows.push(row);
        }

        const expectedValues = [12, 14, 16, 18];
        const expectedKeys = [6, 7, 8, 9];

        validateResults(rows, expectedKeys, expectedValues);
    });
    it('should be able to decode/serialize BIGINT', async function () {
        const SqlColumnType = getSqlColumnType();
        await basicSetup(this);
        const script =
            `
            var map = instance_0.getMap("${mapName}");
            for (var key = 0; key < 10; key++) {
                map.set(new java.lang.Integer(key), new java.lang.Long(key * 2));
            }
        `;
        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
        const result = client.getSqlService().execute(
            `SELECT * FROM ${mapName} WHERE this > ? AND this < ? ORDER BY __key ASC`,
            [long.fromNumber(10), long.fromNumber(18)]
        );
        const rowMetadata = await result.getRowMetadata();
        rowMetadata.getColumn(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.BIGINT);

        const rows = [];

        for await (const row of result) {
            rows.push(row);
        }

        const expectedValues = [long.fromNumber(12), long.fromNumber(14), long.fromNumber(16)];
        const expectedKeys = [6, 7, 8];

        rows.length.should.be.eq(expectedValues.length);

        for (let i = 0; i < rows.length; i++) {
            (rows[i]['this'].eq(expectedValues[i])).should.be.true;
            rows[i]['__key'].should.be.eq(expectedKeys[i]);
        }
    });
    it('should be able to decode/serialize DECIMAL', async function () {
        const SqlColumnType = getSqlColumnType();
        await basicSetup(this);
        const script =
            `
            var map = instance_0.getMap("${mapName}");
            // scale is equals to bigint length
            map.set(new java.lang.Integer(0), new java.math.BigDecimal('0.1111112983672389172378619283677891'));
            // scale is more than bigint length
            map.set(new java.lang.Integer(1), new java.math.BigDecimal('0.00000000000000000000000000000001'));
            // scale is negative
            map.set(new java.lang.Integer(2), new java.math.BigDecimal('132165413213543156412374800000000'));
            // scale is zero
            map.set(new java.lang.Integer(3), new java.math.BigDecimal('1234'));
            // negative value
            map.set(new java.lang.Integer(4), new java.math.BigDecimal('-0.00000000000000000000000000000000000000001'));
            // negative value 2
            map.set(new java.lang.Integer(5), new java.math.BigDecimal('-11.000000000000000000000000000000000000023121'));
        `;
        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
        const result = client.getSqlService().execute(
            `SELECT * FROM ${mapName} WHERE this > CAST(? AS DECIMAL) AND this < CAST(? AS DECIMAL) ORDER BY __key ASC`,
            ['-22.00000000000000000000000000000001', '1.0000000000000231213123123125465462513214653123']
        );
        const rowMetadata = await result.getRowMetadata();
        rowMetadata.getColumn(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.DECIMAL);

        const rows = [];

        for await (const row of result) {
            rows.push(row);
        }

        const expectedValues = [
            '0.1111112983672389172378619283677891',
            '0.00000000000000000000000000000001',
            '-0.00000000000000000000000000000000000000001',
            '-11.000000000000000000000000000000000000023121'
        ];

        const expectedKeys = [0, 1, 4, 5];

        validateResults(rows, expectedKeys, expectedValues);
    });
    it('should be able to decode/serialize REAL', async function () {
        const SqlColumnType = getSqlColumnType();
        await basicSetup(this);
        const script =
            `
            var map = instance_0.getMap("${mapName}");
            for (var key = 1; key < 10; key++) {
                map.set(new java.lang.Integer(key), new java.lang.Float('0.' + key.toString()));
            }
        `;
        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
        const result = client.getSqlService().execute(
            `SELECT * FROM ${mapName} WHERE this > CAST(? AS REAL) AND this < CAST(? AS REAL) ORDER BY __key ASC`,
            [-0.5, 0.5]
        );
        const rowMetadata = await result.getRowMetadata();
        rowMetadata.getColumn(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.REAL);

        const rows = [];

        for await (const row of result) {
            rows.push(row);
        }

        const expectedKeys = [1, 2, 3, 4];
        const expectedValues = [0.1, 0.2, 0.3, 0.4];

        rows.length.should.be.eq(expectedValues.length);

        for (let i = 0; i < rows.length; i++) {
            (rows[i]['this'] - expectedValues[i]).should.be.lessThan(1e-5);
            rows[i]['__key'].should.be.eq(expectedKeys[i]);
        }
    });
    it('should be able to decode/serialize DOUBLE', async function () {
        const SqlColumnType = getSqlColumnType();
        await basicSetup(this);
        const script =
            `
            var map = instance_0.getMap("${mapName}");
            for (var key = 1; key < 10; key++) {
                map.set(new java.lang.Integer(key), new java.lang.Double('0.' + key.toString()));
            }
        `;
        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
        const result = client.getSqlService().execute(
            // cast it if default number type is different
            `SELECT * FROM ${mapName} WHERE this > ? AND this < ? ORDER BY __key ASC`,
            [-0.7, 0.7]
        );
        const rowMetadata = await result.getRowMetadata();
        rowMetadata.getColumn(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.DOUBLE);

        const rows = [];

        for await (const row of result) {
            rows.push(row);
        }

        const expectedKeys = [1, 2, 3, 4, 5, 6];
        const expectedValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];

        rows.length.should.be.eq(expectedValues.length);

        for (let i = 0; i < rows.length; i++) {
            (rows[i]['this'] - expectedValues[i]).should.be.lessThan(1e-5);
            rows[i]['__key'].should.be.eq(expectedKeys[i]);
        }
    });
    it('should be able to decode/serialize DATE', async function () {
        const leftZeroPadInteger = getDatetimeUtil().leftZeroPadInteger;
        const SqlColumnType = getSqlColumnType();
        await basicSetup(this);
        const script =
            `
            var map = instance_0.getMap("${mapName}");
            for (var key = 1; key < 12; key++) {
                map.set(new java.lang.Integer(key), java.time.LocalDate.of(key+2,key+1,key));
            }
        `;
        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
        const result = client.getSqlService().execute(
            `SELECT * FROM ${mapName} WHERE this > CAST (? AS DATE) AND this < CAST (? AS DATE) ORDER BY __key ASC`,
            ['0001-01-01', '0005-05-05']
        );
        const rowMetadata = await result.getRowMetadata();
        rowMetadata.getColumn(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.DATE);

        const rows = [];

        for await (const row of result) {
            rows.push(row);
        }

        const expectedKeys = [1, 2, 3];
        const expectedBaseValues = {
            year: 3,
            month: 2,
            date: 1
        };
        rows.length.should.be.eq(expectedKeys.length);

        for (let i = 0; i < rows.length; i++) {
            const date = rows[i]['this'];
            date.should.be.eq(`${leftZeroPadInteger(expectedBaseValues.year + i, 4)}-`
                + `${leftZeroPadInteger(expectedBaseValues.month + i, 2)}-`
                + `${leftZeroPadInteger(expectedBaseValues.date + i, 2)}`);
            rows[i]['__key'].should.be.eq(expectedKeys[i]);
        }
    });
    it('should be able to decode/serialize TIME', async function () {
        const leftZeroPadInteger = getDatetimeUtil().leftZeroPadInteger;
        const SqlColumnType = getSqlColumnType();
        await basicSetup(this);
        const script = `
                    var map = instance_0.getMap("${mapName}");
                    for (var key = 1; key < 12; key++) {
                        map.set(new java.lang.Integer(key), java.time.LocalTime.of(key+3,key+2,key+1,key + 1e8));
                    }
                `;
        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
        const result = client.getSqlService().execute(
            `SELECT * FROM ${mapName} WHERE this > CAST (? AS TIME) AND this < CAST (? AS TIME) ORDER BY __key ASC`,
            ['01:00:00', '10:00:00']
        );
        const rowMetadata = await result.getRowMetadata();
        rowMetadata.getColumn(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.TIME);

        const rows = [];

        for await (const row of result) {
            rows.push(row);
        }

        const expectedKeys = [1, 2, 3, 4, 5, 6];
        const expectedBaseValue = {
            hour: 4,
            minute: 3,
            second: 2,
            nano: 1 + 1e8
        };
        rows.length.should.be.eq(expectedKeys.length);

        for (let i = 0; i < rows.length; i++) {
            const time = rows[i]['this'];
            time.should.be.eq(`${leftZeroPadInteger(expectedBaseValue.hour + i, 2)}:`
                + `${leftZeroPadInteger(expectedBaseValue.minute + i, 2)}:`
                + `${leftZeroPadInteger(expectedBaseValue.second + i, 2)}.`
                + `${leftZeroPadInteger(expectedBaseValue.nano + i, 9)}`);

            rows[i]['__key'].should.be.eq(expectedKeys[i]);
        }
    });
    it('should be able to decode/serialize TIMESTAMP', async function () {
        const leftZeroPadInteger = getDatetimeUtil().leftZeroPadInteger;
        const SqlColumnType = getSqlColumnType();
        await basicSetup(this);
        const script = `
                    var map = instance_0.getMap("${mapName}");
                    for (var key = 1; key < 12; key++) {
                        map.set(
                          new java.lang.Integer(key),
                          java.time.LocalDateTime.of(key+6, key, key+4, key+3, key+2, key+1, key + 1e8)
                        );
                    }
        `;
        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
        const result = client.getSqlService().execute(
            `SELECT * FROM ${mapName} WHERE this > CAST (? AS TIMESTAMP) AND this < CAST (? AS TIMESTAMP) ORDER BY __key ASC`,
            [
                '0001-06-05T04:03:02.000000001',
                '0009-06-05T04:03:02.000000001'
            ]
        );
        const rowMetadata = await result.getRowMetadata();
        rowMetadata.getColumn(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.TIMESTAMP);

        const rows = [];

        for await (const row of result) {
            rows.push(row);
        }

        const expectedKeys = [1, 2, 3];
        const expectedBaseValue = {
            year: 7,
            month: 1,
            date: 5,
            hour: 4,
            minute: 3,
            second: 2,
            nano: 1 + 1e8
        };

        rows.length.should.be.eq(expectedKeys.length);

        for (let i = 0; i < rows.length; i++) {
            const datetime = rows[i]['this'];
            datetime.should.be.eq(`${leftZeroPadInteger(expectedBaseValue.year + i, 4)}-`
                + `${leftZeroPadInteger(expectedBaseValue.month + i, 2)}-`
                + `${leftZeroPadInteger(expectedBaseValue.date + i, 2)}T`
                + `${leftZeroPadInteger(expectedBaseValue.hour + i, 2)}:`
                + `${leftZeroPadInteger(expectedBaseValue.minute + i, 2)}:`
                + `${leftZeroPadInteger(expectedBaseValue.second + i, 2)}.`
                + `${leftZeroPadInteger(expectedBaseValue.nano + i, 9)}`);
            rows[i]['__key'].should.be.eq(expectedKeys[i]);
        }
    });
    it('should be able to decode/serialize TIMESTAMP WITH TIMEZONE', async function () {
        const datetimeUtil = getDatetimeUtil();
        const leftZeroPadInteger = datetimeUtil.leftZeroPadInteger;
        const getTimezoneOffsetFromSeconds = datetimeUtil.getTimezoneOffsetFromSeconds;

        const SqlColumnType = getSqlColumnType();
        await basicSetup(this);
        const script =
            `
            var map = instance_0.getMap("${mapName}");
            for (var key = 1; key < 12; key++) {
                map.set(
                  new java.lang.Integer(key),
                  java.time.OffsetDateTime.of(
                    key+6, key, key+4, key+3, key+2, key+1, key + 1e8,
                    java.time.ZoneOffset.ofTotalSeconds(key * key * key)
                  )
                );
            }
        `;
        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
        const result = client.getSqlService().execute(
            `SELECT * FROM ${mapName} WHERE this > CAST (? AS TIMESTAMP_WITH_TIME_ZONE)` +
            'AND this < CAST (? AS TIMESTAMP_WITH_TIME_ZONE) ORDER BY __key ASC',
            [
                '0001-06-05T04:03:02.000000001Z',
                '0009-06-05T04:03:02.000000001Z'
            ]
        );
        const rowMetadata = await result.getRowMetadata();
        rowMetadata.getColumn(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.TIMESTAMP_WITH_TIME_ZONE);

        const rows = [];

        for await (const row of result) {
            rows.push(row);
        }

        const expectedKeys = [1, 2, 3];
        const expectedBaseValue = {
            year: 7,
            month: 1,
            date: 5,
            hour: 4,
            minute: 3,
            second: 2,
            nano: 1 + 1e8,
            offsetSeconds: 1
        };
        rows.length.should.be.eq(expectedKeys.length);

        for (let i = 0; i < rows.length; i++) {
            const datetimeWithOffset = rows[i]['this'];
            datetimeWithOffset.should.be.a('string');

            datetimeWithOffset.should.be.eq(`${leftZeroPadInteger(expectedBaseValue.year + i, 4)}-`
                + `${leftZeroPadInteger(expectedBaseValue.month + i, 2)}-`
                + `${leftZeroPadInteger(expectedBaseValue.date + i, 2)}T`
                + `${leftZeroPadInteger(expectedBaseValue.hour + i, 2)}:`
                + `${leftZeroPadInteger(expectedBaseValue.minute + i, 2)}:`
                + `${leftZeroPadInteger(expectedBaseValue.second + i, 2)}.`
                + `${leftZeroPadInteger(expectedBaseValue.nano + i, 9)}`
                + `${getTimezoneOffsetFromSeconds((expectedBaseValue.offsetSeconds + i) ** 3)}`);
            rows[i]['__key'].should.be.eq(expectedKeys[i]);
        }
    });
    it('should be able to decode/serialize OBJECT(portable) without server config', async function () {
        const SqlColumnType = getSqlColumnType();
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            serialization: {
                portableFactories: {
                    666: portableFactory
                }
            }
        });
        TestUtil.markServerVersionAtLeast(this, client, '4.2');
        mapName = TestUtil.randomString(10);
        someMap = await client.getMap(mapName);
        await someMap.addIndex({
            type: 'SORTED',
            attributes: ['age']
        });

        const student1 = new Student(long.fromNumber(12), 123.23);
        const student2 = new Student(long.fromNumber(15), null);
        const student3 = new Student(long.fromNumber(17), null);
        await someMap.put(0, student1);
        await someMap.put(1, student2);
        await someMap.put(2, student3);

        const result = client.getSqlService().execute(
            `SELECT * FROM ${mapName} WHERE age > ? AND age < ? ORDER BY age DESC`,
            [long.fromNumber(13), long.fromNumber(18)]
        );

        const rowMetadata = await result.getRowMetadata();
        rowMetadata.getColumn(rowMetadata.findColumn('age')).type.should.be.eq(SqlColumnType.BIGINT);
        rowMetadata.getColumn(rowMetadata.findColumn('height')).type.should.be.eq(SqlColumnType.REAL);

        const rows = [];

        for await (const row of result) {
            rows.push(row);
        }

        const expectedKeys = [2, 1];
        const expectedValues = [student3, student2];

        rows.length.should.be.eq(expectedValues.length);

        for (let i = 0; i < rows.length; i++) {
            (rows[i]['age'].eq(expectedValues[i].age)).should.be.true;
            (rows[i]['height'] - expectedValues[i].height).should.be.lessThan(1e-5);
            rows[i]['__key'].should.be.eq(expectedKeys[i]);
        }
    });
});
