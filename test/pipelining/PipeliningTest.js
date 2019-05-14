/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = require("chai").expect;
var Pipelining = require('../../.').Pipelining;
var Promise = require('bluebird');
var Util = require('../Util');

describe('Pipelining', function () {
    var ITEM_COUNT = 10000;
    var expected = [];

    before(function () {
        for (var i = 0; i < ITEM_COUNT; i++) {
            expected.push(i);
        }
    });

    function fakeLoadGenerator() {
        return Promise.resolve('fake');
    }

    function createLoadGenerator() {
        var counter = 0;
        return function () {
            var index = counter++;
            if (index < ITEM_COUNT) {
                return Promise.resolve(index);
            }
            return null;
        }
    }

    function createLoadGeneratorWithHandler(actual, counterStart) {
        var counter = counterStart;
        var limit = counterStart + ITEM_COUNT;
        return function () {
            var index = counter++;
            if (index < limit) {
                return Promise.resolve(index - counterStart).then(function (value) {
                    actual[index] = value;
                });
            }
            return null;
        }
    }

    function createRejectingLoadGenerator() {
        var counter = 0;
        var promises = [
            () => Promise.resolve('foo'),
            () => Promise.reject('Error1'),
        ];
        return function () {
            var index = counter++;
            if (index < promises.length) {
                return promises[index]();
            }
            return null;
        }
    }

    it('should throw if non-positive depth is passed to constructor', function () {
        expect(function () {
            return new Pipelining(-1, fakeLoadGenerator);
        }).to.throw(RangeError);
        expect(function () {
            return new Pipelining(0, fakeLoadGenerator)
        }).to.throw(RangeError);
    });

    it('should throw if null load generator is passed to constructor', function () {
        expect(function () {
            return new Pipelining(1, null);
        }).to.throw(TypeError);
    });

    it('should return results in order when it stores results', function () {
        var pipelining = new Pipelining(100, createLoadGenerator(), true);
        return pipelining.run().then(function (results) {
           expect(results).to.deep.equal(expected);
        });
    });

    it('should not store results by default', function () {
        var actual = [];

        var pipelining = new Pipelining(100, createLoadGeneratorWithHandler(actual, 0));
        return pipelining.run().then(function (results) {
            expect(results).to.be.an('undefined');
            expect(actual).to.deep.equal(expected);
        });
    });

    it('should succeed with depth 1 with storage of the results', function () {
        var pipelining = new Pipelining(1, createLoadGenerator(), true);
        return pipelining.run().then(function (results) {
            expect(results).to.deep.equal(expected);
        })
    });

    it('should succeed with depth 1000 with storage of the results', function () {
        var pipelining = new Pipelining(1000, createLoadGenerator(), true);
        return pipelining.run().then(function (results) {
            expect(results).to.deep.equal(expected);
        })
    });

    it('should succeed with depth 1 without storage of the results', function () {
        var actual = [];

        var pipelining = new Pipelining(1, createLoadGeneratorWithHandler(actual, 0));
        return pipelining.run().then(function (results) {
            expect(results).to.be.an('undefined');
            expect(actual).to.deep.equal(expected);
        })
    });

    it('should succeed with depth 1000 without storage of the results', function () {
        var actual = [];

        var pipelining = new Pipelining(1000, createLoadGeneratorWithHandler(actual, 0));
        return pipelining.run().then(function (results) {
            expect(results).to.be.an('undefined');
            expect(actual).to.deep.equal(expected);
        })
    });

    it('should reject if any of the requests fail without storage of the results', function () {
        var pipelining = new Pipelining(1, createRejectingLoadGenerator());
        return expect(pipelining.run()).to.be.be.rejectedWith('Error1');
    });

    it('should reject if any of the requests fail with storage of the results', function () {
        var pipelining = new Pipelining(1, createRejectingLoadGenerator(), true);
        return expect(pipelining.run()).to.be.be.rejectedWith('Error1');
    });

    it('should throw when multiple run calls are made without the storage of results ', function () {
        var actual = [];

        var pipelining = new Pipelining(100, createLoadGeneratorWithHandler(actual, 0));
        return pipelining.run().then(function (result) {
            expect(result).to.be.an('undefined');
            expect(actual).to.deep.equal(expected);
            return expect(pipelining.run()).to.be.rejectedWith();
        })
    });

    it('should throw when multiple run calls are made with the storage of results ', function () {
        var pipelining = new Pipelining(100, createLoadGenerator(), true);
        return pipelining.run().then(function (result) {
            expect(result).to.deep.equal(expected);
            return expect(pipelining.run()).to.be.rejectedWith();
        })
    });

    it('should respect depth 1', function () {
        var limit = 500;
        var counter = 0;
        var activeRequestCount = 0;

        function loadGenerator() {
            var index = counter++;
            if (index < limit) {
                activeRequestCount++;
                expect(activeRequestCount).to.be.at.most(1);
                return new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        activeRequestCount--;
                        resolve(index);
                    }, Util.getRandomInt(0, 10));
                });
            }
            return null;
        }

        var pipelining = new Pipelining(1, loadGenerator, true);
        return pipelining.run().then(function (results) {
            var expected = [];
            for (var i = 0; i < limit; i++) {
                expected.push(i);
            }
            expect(results).to.deep.equal(expected);
        });
    });

    it('should respect depth 100', function () {
        var counter = 0;
        var activeRequestCount = 0;

        function loadGenerator() {
            var index = counter++;
            if (index < ITEM_COUNT) {
                activeRequestCount++;
                expect(activeRequestCount).to.be.at.most(100);
                return new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        activeRequestCount--;
                        resolve(index);
                    }, Util.getRandomInt(0, 10));
                });
            }
            return null;
        }

        var pipelining = new Pipelining(100, loadGenerator, true);
        return pipelining.run().then(function (results) {
            expect(results).to.deep.equal(expected);
        });
    });
});
