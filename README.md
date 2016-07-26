# Table of Contents

* [Hazelcast Node.js Client](#hazelcast-nodejs-client)
* [Features](#features)
* [Installing the Client](#installing-the-client)
* [Using the Client](#using-the-client)
* [Development](#development)
  * [Building And Installing from Sources](#building-and-installing-from-sources)
  * [Using Locally Installed Package](#using-locally-installed-package)
* [Testing](#testing)
  * [Testing Prerequisites](#testing-prerequisites)
  * [Running the Tests](#running-the-tests)
* [Release Notes](#release-notes)
* [Mail Group](#mail-group)
* [License](#license)
* [Copyright](#copyright)


# Hazelcast Node.js Client

> **NOTE: This project is currently in active development.**

[![Join the chat at https://gitter.im/hazelcast-incubator/hazelcast-nodejs-client](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/hazelcast-incubator/hazelcast-nodejs-client?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
<br></br>

This document explains Node.js client for Hazelcast which uses Hazelcast's Open Client Protocol 1.0. This client works with Hazelcast 3.6 and higher.  

**Hazelcast** is a clustering and highly scalable data distribution platform. With its various distributed data structures, distributed caching capabilities, elastic nature and more importantly with so many happy users, Hazelcast is a feature-rich, enterprise-ready and developer-friendly in-memory data grid solution.


# Features

Hazelcast Node.js client supports the following data structures and features:

* Map (except entry processors) and MultiMap
* Queue, Set, and List
* Lock
* Smart Client
* Hazelcast Native Serialization
* Distributed Object Listener
* Lifecycle Service

# Installing the Client

Following command installs Hazelcast Node.js client:

```
npm install hazelcast-client --save
```

# Using the Client

Following script illustrates a basic example in which a map is created in Hazelcast Node.js client and an entry is added to that map:

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

Please see Hazelcast Node.js [code samples](https://github.com/hazelcast/hazelcast-nodejs-client/tree/master/code_samples) for more examples.

You can also refer to Hazelcast Node.js [API Documentation](http://hazelcast.github.io/hazelcast-nodejs-client/api/0.4/docs/).


# Development

## Building And Installing from Sources

Follow the below steps to build and install Hazelcast Node.js client from its source:

- Clone the GitHub repository [https://github.com/hazelcast/hazelcast-nodejs-client.git](https://github.com/hazelcast/hazelcast-nodejs-client.git).
- Install the dependencies using the command `npm install`.
- Compile TypeScript using the command `npm run compile`.
- Link the package locally using the command `npm link`.

## Using Locally Installed Package

- Change directory to the project directory.
- Use a locally linked module: `npm link hazelcast-client`.
- Tryout the example shown in [Using the Client](#using-the-client) section.

# Testing

## Testing Prerequisites

* [Java 6+](http://www.oracle.com/technetwork/java/javase/downloads/server-jre8-downloads-2133154.html)
* Maven

    ```
    Maven automatically downloads hazelcast-remote-controller and hazelcast from maven repository.
    ```

## Running the Tests

Following command starts the tests:

```
npm test
```

# Release Notes

You can see the release notes for each release on the [Releases](https://github.com/hazelcast/hazelcast-nodejs-client/releases) page.

# Mail Group

Please join the mail group if you are interested in using or developing Hazelcast.

http://groups.google.com/group/hazelcast

# License

Hazelcast is available under the Apache 2 License. Please see the [Licensing appendix](http://docs.hazelcast.org/docs/latest/manual/html-single/hazelcast-documentation.html#license-questions) for more information.

# Copyright

Copyright (c) 2008-2016, Hazelcast, Inc. All Rights Reserved.

Visit [www.hazelcast.com](http://www.hazelcast.com) for more information.
