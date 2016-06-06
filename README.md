# Hazelcast Node.js Client
Node.js Client for Hazelcast, using Hazelcast Open Client Protocol 1.0 for Hazelcast 3.6 and higher

**Hazelcast** is a clustering and highly scalable data distribution platform.

With its various distributed data structures, distributed caching capabilities, elastic nature and more importantly with so many happy users, Hazelcast is feature-rich, enterprise-ready and developer-friendly in-memory data grid solution.

> **NOTE: This project is currently in active development.**

[![Join the chat at https://gitter.im/hazelcast-incubator/hazelcast-nodejs-client](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/hazelcast-incubator/hazelcast-nodejs-client?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Implemented Features
* Map (except Predicates, EntryProcessors)
* Set
* Queue
* List
* Hazelcast Native Serialization
* Distributed Object Listener
* Lifecycle Service
* Smart Client

## Installation
```
npm install hazelcast-client --save
```

## Usage
```javascript
var HazelcastClient = require('hazelcast-client').Client;
var person = {
    firstName: "Joe",
    lastName: "Doe",
    age: 42
};
var map;
HazelcastClient.newHazelcastClient().then(function (hazelcastClient) {
    map = hazelcastClient.getMap("personMap");
    map.put(1, person).then(function (val) {
        // prints previous value for key `1`
        console.log(val);
    });
    map.get(1).then(function (value) {
        console.log(value);
    })
});
```
See [code samples](code_samples/) for further information.

## Development

### Build And Install `hazelcast-client` From Sources
- clone repo [https://github.com/hazelcast/hazelcast-nodejs-client.git](https://github.com/hazelcast/hazelcast-nodejs-client.git)
- install dependencies `npm install`
- compile TypeScript `npm run compile`
- link package locally `npm link`

### Use Locally Installed Package
- `cd` to project directory
- use a locally linked module `npm link hazelcast-client`
- follow [usage](#Usage) example

## Test

### Test Prerequisites

* [Java 6+](http://www.oracle.com/technetwork/java/javase/downloads/server-jre8-downloads-2133154.html)
* [Hazelcast Remote Controller](https://github.com/hazelcast/hazelcast-remote-controller)
    * [Follow README](https://github.com/hazelcast/hazelcast-remote-controller/blob/master/nodejs-controller/README.md)
* run the tests
    ```
    npm test
    ```

### Mail Group

Please join the mail group if you are interested in using or developing Hazelcast.

http://groups.google.com/group/hazelcast

### License

Hazelcast is available under the Apache 2 License. Please see the [Licensing appendix](http://docs.hazelcast.org/docs/latest/manual/html-single/hazelcast-documentation.html#license-questions) for more information.

### Copyright

Copyright (c) 2008-2016, Hazelcast, Inc. All Rights Reserved.

Visit [www.hazelcast.com](http://www.hazelcast.com) for more info.
