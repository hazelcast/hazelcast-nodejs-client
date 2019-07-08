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
var expect = chai.expect;
var fs = require('fs');
var path = require('path');
var ConfigBuilder = require('../../').ConfigBuilder;
var Errors = require('../..').HazelcastErrors;

describe('ConfigBuilderFailFastTest', function () {
    var JSON_LOCATION = path.resolve(process.cwd(), 'hazelcast-client-failfast.json');
    var ENV_VARIABLE_NAME = 'HAZELCAST_CLIENT_CONFIG';

    before(function () {
        process.env[ENV_VARIABLE_NAME] = JSON_LOCATION;
    });

    afterEach(function () {
        try {
            fs.unlinkSync(JSON_LOCATION);
        } catch (e) {
        }
    });

    // INVALID PATH

    it('listener config should fail fast with invalid path', function () {
        return testConfig('' +
            '{' +
            '   "listeners": [' +
            '       {' +
            '           "type": "lifecycle",' +
            '           "path": "./invalid/path"' +
            '       }' +
            '   ]' +
            '}');
    });

    it('ssl config should fail fast with invalid factory path', function () {
        return testConfig('' +
            '{' +
            '   "network": {' +
            '       "ssl": {' +
            '           "enabled": true,' +
            '           "factory": {' +
            '               "path": "./invalid/path"' +
            '           }' +
            '       }' +
            '   }' +
            '}');
    });

    it('serialization config should fail fast with invalid data serializable factory path', function () {
        return testConfig('' +
            '{' +
            '   "serialization": {' +
            '       "dataSerializableFactories": [' +
            '           {' +
            '               "path": "./invalid/path"' +
            '           }' +
            '       ]' +
            '   }' +
            '}');
    });

    it('serialization config should fail fast with invalid portable factory path', function () {
        return testConfig('' +
            '{' +
            '   "serialization": {' +
            '       "portableFactories" : [' +
            '           {' +
            '               "path" : "./invalid/path"' +
            '           }' +
            '       ]' +
            '   }' +
            '}');
    });

    it('serialization config should fail fast with invalid global serializer path', function () {
        return testConfig('' +
            '{' +
            '   "serialization": {' +
            '       "globalSerializer": {' +
            '           "path": "./invalid/path"' +
            '       }' +
            '   }' +
            '}');
    });

    it('serialization config should fail fast with invalid custom serializer path', function () {
        return testConfig('' +
            '{' +
            '   "serialization": {' +
            '       "serializers": [' +
            '           {' +
            '               "path": "./invalid/path"' +
            '           }' +
            '       ]' +
            '   }' +
            '}');
    });

    // INVALID EXPORT NAME

    it('ssl config should fail fast with invalid factory export name', function () {
        return testConfig('' +
            '{' +
            '   "network": {' +
            '       "ssl": {' +
            '           "enabled": true,' +
            '           "factory": {' +
            '               "path": "./test/declarative_config/config_files/ssl_factory.js",' +
            '               "exportedName": "invalid"' +
            '           }' +
            '       }' +
            '   }' +
            '}');
    });

    it('serialization config should fail fast with invalid data serializable factory export name', function () {
        return testConfig('' +
            '{' +
            '   "serialization": {' +
            '       "dataSerializableFactories": [' +
            '           {' +
            '               "path": "./test/declarative_config/config_files/data_serializable_factory.js",' +
            '               "exportedName": "invalid"' +
            '           }' +
            '       ]' +
            '   }' +
            '}');
    });

    it('serialization config should fail fast with invalid portable factory export name', function () {
        return testConfig('' +
            '{' +
            '   "serialization": {' +
            '       "portableFactories" : [' +
            '           {' +
            '               "path" : "./test/declarative_config/config_files/portable_factory.js",' +
            '               "exportedName": "invalid"' +
            '           }' +
            '       ]' +
            '   }' +
            '}');
    });

    it('serialization config should fail fast with invalid global serializer export name', function () {
        return testConfig('' +
            '{' +
            '   "serialization": {' +
            '       "globalSerializer": {' +
            '           "path": "./test/declarative_config/config_files/global_serializer.js",' +
            '           "exportedName": "invalid"' +
            '       }' +
            '   }' +
            '}');
    });

    it('serialization config should fail fast with invalid custom serializer export name', function () {
        return testConfig('' +
            '{' +
            '   "serialization": {' +
            '       "serializers": [' +
            '           {' +
            '               "path": "./test/declarative_config/config_files/custom_serializer1.js",' +
            '               "exportedName": "invalid"' +
            '           }' +
            '       ]' +
            '   }' +
            '}');
    });

    // OTHERS

    it('ssl config should fail fast when ssl factory and ssl options are set', function () {
        return testConfig('' +
            '{' +
            '   "network": {' +
            '       "ssl": {' +
            '           "enabled": true,' +
            '           "sslOptions": {' +
            '               "key": "val"' +
            '           },' +
            '           "factory": {' +
            '               "key": "val"' +
            '           }' +
            '       }' +
            '   }' +
            '}');
    });

    it('ssl config should fail fast when import path is not ' +
        'set and exported name is not BasicSSLOptionsFactory', function () {
        return testConfig('' +
            '{' +
            '   "network": {' +
            '       "ssl": {' +
            '           "enabled": true,' +
            '           "factory": {' +
            '               "exportedName": "invalid"' +
            '           }' +
            '       }' +
            '   }' +
            '}');
    });

    function testConfig(jsonConfigString) {
        fs.writeFileSync(JSON_LOCATION, jsonConfigString);

        var configBuilder = new ConfigBuilder();
        return configBuilder.loadConfig().then(function () {
            expect(configBuilder.build.bind(configBuilder)).to.throw(Errors.HazelcastError);
        });
    }

});
