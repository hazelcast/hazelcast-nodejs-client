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

//Custom SSL Factory

var fs = require('fs');

function SSLFactory() {
}

SSLFactory.prototype.init = function(props) {
    this.caPath = props.caPath;
    return Promise.resolve();
};

SSLFactory.prototype.getSSLOptions = function() {
    var sslOpts = {
        servername: 'foo.bar.com',
        rejectUnauthorized: true,
        ca: fs.readFileSync(this.caPath),
    };
    return sslOpts;
};
exports.SSLFactory = SSLFactory;

