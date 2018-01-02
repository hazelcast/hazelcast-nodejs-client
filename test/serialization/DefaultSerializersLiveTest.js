/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

var Client = require('../../.').Client;
var RC = require('../RC');
var expect = require('chai').expect;
describe('Default serializers with live instance', function() {
    var cluster;
    var member;
    var client;
    var map;

    before(function() {
        return RC.createCluster(null, null).then(function (res) {
            cluster = res;
        }).then(function() {
            return RC.startMember(cluster.id);
        }).then(function (m) {
            member = m;
            return Client.newHazelcastClient();
        }).then(function (cl) {
            client = cl;
            map = client.getMap('test');
        });
    });

    after(function() {
        client.shutdown();
        return RC.shutdownCluster(cluster.id);
    });

    function _generateGet(key) {
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
            'result = ""+foo();'
    }

    it('string', function () {
        return map.put('testStringKey', 'testStringValue').then(function () {
            return RC.executeOnController(cluster.id, _generateGet('testStringKey'), 1);
        }).then(function(response) {
            return expect(response.result.toString()).to.equal('testStringValue');
        })
    });

    it('emoji string', function () {
        return map.put('key', '1⚐中💦2😭‍🙆😔5').then(function () {
            return RC.executeOnController(cluster.id, _generateGet('key'), 1);
        }).then(function (response) {
            return expect(response.result.toString()).to.equal('1⚐中💦2😭‍🙆😔5');
        });
    });

    it('utf8 characters test', function() {
        return map.put('key', '\u0040\u0041\u01DF\u06A0\u12E0\u{1D306}').then(function () {
            return RC.executeOnController(cluster.id, _generateGet('key'), 1);
        }).then(function (response) {
            return expect(response.result.toString()).to.equal('\u0040\u0041\u01DF\u06A0\u12E0\u{1D306}');
        });
    });

    it('utf8 characters test with surrogates', function() {
        return map.put('key', '\u0040\u0041\u01DF\u06A0\u12E0\uD834\uDF06').then(function () {
            return RC.executeOnController(cluster.id, _generateGet('key'), 1);
        }).then(function (response) {
            return expect(response.result.toString()).to.equal('\u0040\u0041\u01DF\u06A0\u12E0\u{1D306}');
        });
    });

    it('utf8 sample string test', function() {
        return map.put('key', 'Iñtërnâtiônàlizætiøn').then(function () {
            return RC.executeOnController(cluster.id, _generateGet('key'), 1);
        }).then(function (response) {
            return expect(response.result.toString()).to.equal('Iñtërnâtiônàlizætiøn');
        });
    });

    it('number', function () {
        return map.put('a', 23).then(function () {
            return RC.executeOnController(cluster.id, _generateGet('a'), 1);
        }).then(function(response) {
            return expect(Number.parseInt(response.result.toString())).to.equal(23);
        })
    });

    it('array', function() {
        return map.put('a', ['a', 'v', 'vg']).then(function () {
            return RC.executeOnController(cluster.id, _generateGet('a'), 1);
        }).then(function(response) {
            return expect(response.result.toString()).to.equal(['a', 'v', 'vg'].toString());
        })
    })
});
