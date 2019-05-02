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

var expect = require('chai').expect;
var path = require('path');
var ConfigBuilder = require('../../').ConfigBuilder;
var fs = require('fs');
var path = require('path');
var RuntimeUtil = require('../../lib/Util');

describe('ConfigLocationTest', function () {
    var DEFAULT_JSON_LOCATION = path.resolve(process.cwd(), 'hazelcast-client.json');
    var ENV_VARIABLE_NAME = 'HAZELCAST_CLIENT_CONFIG';

    afterEach(function () {
        try {
            fs.unlinkSync(DEFAULT_JSON_LOCATION);
        } catch (e) {
            //
        } finally {
            delete process.env[ENV_VARIABLE_NAME];
        }
    });

    it('Prefers environment variable location over default location', function () {
        //create a hazelcast-client.json at current working directory so we can be sure it is ignored.
        fs.writeFileSync(DEFAULT_JSON_LOCATION, '' +
            '{' +
            '   "group": {' +
            '       "name": "wrongName"' +
            '   }' +
            '}');
        process.env[ENV_VARIABLE_NAME] = path.join(__dirname, 'configurations/full.json');
        var configBuilder = new ConfigBuilder();
        return configBuilder.loadConfig().then(function () {
            return expect(configBuilder.build().groupConfig.name).equals('hazel');
        });
    });

    it('Prefers default location json file over default config', function () {
        fs.writeFileSync(DEFAULT_JSON_LOCATION, '' +
            '{' +
            '   "group": {' +
            '       "name": "newName"' +
            '   }' +
            '}');
        var configBuilder = new ConfigBuilder();
        return configBuilder.loadConfig().then(function () {
            return expect(configBuilder.build().groupConfig.name).equals('newName');
        });
    });

    it('Starts with default configuration if no config', function () {
        var configBuilder = new ConfigBuilder();
        return configBuilder.loadConfig().then(function () {
            return expect(configBuilder.build().groupConfig.name).equals('dev');
        });
    });

    it('Util.resolvePath test', function () {
        expect(RuntimeUtil.resolvePath('.')).to.equal(process.cwd());
        expect(RuntimeUtil.resolvePath('filename')).to.equal(path.join(process.cwd(), 'filename'));
        expect(RuntimeUtil.resolvePath('..')).to.equal(path.join(process.cwd(), '..'));
        process.env[ENV_VARIABLE_NAME] = 'aRelativeBase/config.json';
        expect(RuntimeUtil.resolvePath('.')).to.equal(path.join(process.cwd(), 'aRelativeBase'));
        expect(RuntimeUtil.resolvePath('filename')).to.equal(path.join(process.cwd(), 'aRelativeBase', 'filename'));
        expect(RuntimeUtil.resolvePath('..')).to.equal(process.cwd());
        process.env[ENV_VARIABLE_NAME] = '/anAbsoluteBase/config.json';
        var root = path.parse(process.cwd()).root;
        expect(RuntimeUtil.resolvePath('.')).to.equal(path.join(root, 'anAbsoluteBase'));
        expect(RuntimeUtil.resolvePath('filename')).to.equal(path.join(root, 'anAbsoluteBase', 'filename'));
        expect(RuntimeUtil.resolvePath('..')).to.equal(root);
    })
});
