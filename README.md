# Table of Contents

* [Hazelcast Node.js Client](#hazelcast-nodejs-client)
* [Features](#features)
* [Installing the Client](#installing-the-client)
* [Using the Client](#using-the-client)
* [Configuration Overview](#configuration-overview)
  * [1. Configuration Options](#1-configuration-options)
    * [1.1. Programmatic Configuration](#11-programmatic-configuration)
    * [1.2. Declarative Configuration (JSON)](#12-declarative-configuration-json)
  * [2. Importing Multiple Configurations](#2-importing-multiple-configurations)
  * [3. Loading Objects and Path Resolution](#3-loading-objects-and-path-resolution)
* [Code Samples](#code-samples)
* [Serialization Considerations](#serialization-considerations)
* [Setting Up Client Network](#setting-up-client-network)
  * [1. Providing the Member Addresses](#1-providing-the-member-addresses)
  * [2. Setting Smart Routing](#2-setting-smart-routing)
  * [3. Setting Redo Operation](#3-enabling-redo-operation)
  * [4. Setting Connection Timeout](#4-setting-connection-timeout)
  * [5. Setting Connection Attempt Limit](#5-setting-connection-attempt-limit)
  * [6. Setting Connection Attempt Period](#6-setting-connection-attempt-period)
  * [7. Enabling Hazelcast Cloud Discovery](#7-enabling-hazelcast-cloud-discovery)
* [Using Node.js Client with Hazelcast IMDG](#using-nodejs-client-with-hazelcast-imdg)
  * [1. Node.js Client API Overview](#1-nodejs-client-api-overview)
  * [2. Using Distributed Data Structures](#2-using-distributed-data-structures)
    * [2.1. Using Map](#21-using-map)
    * [2.2. Using MultiMap](#22-using-multimap)
    * [2.3. Using ReplicatedMap](#23-using-replicatedmap)
    * [2.4. Using Queue](#24-using-queue)
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
<br />

This document explains Node.js client for Hazelcast which uses Hazelcast's Open Client Protocol 1.6. This client works with Hazelcast 3.6 and higher.

**Hazelcast** is a clustering and highly scalable data distribution platform. With its various distributed data structures, distributed caching capabilities, elastic nature and more importantly with so many happy users, Hazelcast is a feature-rich, enterprise-ready and developer-friendly in-memory data grid solution.


# Features

Hazelcast Node.js client supports the following data structures and features:

* Map
* Queue
* Set
* List
* Multi Map
* Replicated Map
* Ringbuffer
* Reliable Topic
* Near Cache support for Map
* Lock
* Semaphore
* Atomic Long
* Flake Id Generator
* Fast Aggregations
* CRDT Counter
* Event Listeners
* Entry Processors
* Predicates
* Smart Client
* Unisocket Client
* Hazelcast Native Serialization
* Lifecycle Service
* SSL connection support (requires enterprise server)
* Hazelcast Cloud Discovery

# Installing the Client

Following command installs Hazelcast Node.js client:

```
npm install hazelcast-client --save
```

# Using the Client

Hazelcast Node.js Client connects to a Hazelcast IMDG cluster. See [https://hazelcast.org/download/](https://hazelcast.org/download/).

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

You can also refer to Hazelcast Node.js [API Documentation](http://hazelcast.github.io/hazelcast-nodejs-client/api/current/docs/).

# Configuration Overview

This chapter describes the options to configure your Node.js client and explains how you can import multiple configurations
and how you should set paths and exported names for the client to load objects.

## 1. Configuration Options

You can configure Hazelcast Node.js Client declaratively (JSON) or programmatically (API).

* Programmatic configuration
* Declarative configuration (JSON file)

### 1.1. Programmatic Configuration

For programmatic configuration of the Hazelcast Node.js Client, just instantiate a `ClientConfig` object and configure the
desired aspects. An example is shown below.

```javascript
var Config = require('hazelcast-client').Config;
var Address = require('hazelcast-client').Address;
var cfg = new Config.ClientConfig();
cfg.networkConfig.addresses.push('127.0.0.1:5701');
return HazelcastClient.newHazelcastClient(cfg);
```

Refer to `ClientConfig` class documentation at [Hazelcast Node.js Client API Docs](http://hazelcast.github.io/hazelcast-nodejs-client/api/current/docs) for details.

### 1.2. Declarative Configuration (JSON)

If the client is not supplied with a programmatic configuration at the time of initialization, it will look for a configuration file named `hazelcast-client.json`. If this file exists, then the configuration is loaded from it. Otherwise, the client will start with the default configuration. The following are the places that the client looks for a `hazelcast-client.json` in order:

1. Environment variable: The client first looks for the environment variable `HAZELCAST_CLIENT_CONFIG`. If it exists,
the client looks for the configuration file in the specified location.
2. Current working directory: If there is no environment variable set, the client tries to load `hazelcast-client.json`
from the current working directory.
3. Default configuration: If all of the above methods fail, the client starts with the default configuration.
The default configuration is programmatic. If you want to override the default configuration declaratively, you need to create
a `hazelcast-client.json` file in your working directory. If you want to have an example for this file, you can find `hazelcast-client-default.json` and `hazelcast-client-sample.json` files in the Github repository.

Following is a sample JSON configuration file:

```json
{
    "group": {
        "name": "hazel",
        "password": "cast"
    },
    "properties": {
        "hazelcast.client.heartbeat.timeout": 10000,
        "hazelcast.client.invocation.retry.pause.millis": 4000,
        "hazelcast.client.invocation.timeout.millis": 180000,
        "hazelcast.invalidation.reconciliation.interval.seconds": 50,
        "hazelcast.invalidation.max.tolerated.miss.count": 15,
        "hazelcast.invalidation.min.reconciliation.interval.seconds": 60
    },
    "network": {
        "clusterMembers": [
            "127.0.0.1:5701"
        ],
        "smartRouting": true,
        "connectionTimeout": 6000,
        "connectionAttemptPeriod": 4000,
        "connectionAttemptLimit": 3
    }
}
```

In the following chapters you will learn the description of all elements included in a JSON configuration file used to configure Hazelcast Node.js client.

## 2. Importing Multiple Configurations

You can compose the declarative configuration of your Node.js client from multiple declarative
configuration snippets. In order to compose a declarative configuration, you can use the `import` element to load
different declarative configuration files.

Let's assume you have the following two configurations:

`group-config.json`:

```json
{
    "group": {
        "name": "hazel",
        "password": "cast"
    }
}
```

`network-config.json`:

```json
{
    "network": {
        "clusterMembers": [
            "127.0.0.10:4001",
            "127.0.0.11:4001"
        ]
    }
}
```

To get your example client configuration out of the above two, use the `import` element as
shown below.

```json
{
    "import": [
        "group-config.json",
        "network-config.json"
    ]
}
```

> Note: Use `import` element on top level of JSON hierarchy.

## 3. Loading Objects and Path Resolution

For configuration elements that require you to specify a code piece, you will need to specify the path to the
code and name of the exported element that you want the client to use. This configuration is set as follows:

```json
{
    "path": "path/to/file",
    "exportedName": "MyObject"
}
```

In the above configuration, `path` shows the address to the file that you want the client to load. Unless this is an
absolute path, it is relative to the location of `hazelcast-config.json` file.

In Javascript, you can define and export as many objects as you want in a single file. Above configuration element
is designed to load only one specified object from a file (`MyObject`). Therefore, `exportedName` specifies the name of desired object.

Let's say your project's directory structure is as follows:

    my_app/
    my_app/index.js
    my_app/factory_utils.js
    my_app/hazelcast-client.json
    my_app/node_modules/
    my_app/node_modules/hazelcast-client

In `factory_utils.js`, you have multiple exported functions.

```javascript
exports.utilityFunction = function() {...}
exports.MySSLFactory = function() {...}
```

In order to load `MySSLFactory` in your SSL configuration, you should set `path` and `exportedName` as `factory_utils.js`
and `MySSLFactory` respectively.

If you have only one export as the default export from `factory_utils.js`, just skip `exportedName` property and
the client will load the default export from the file.


# Code Samples

See [Code Samples](https://github.com/hazelcast/hazelcast-nodejs-client/tree/master/code_samples)


# Serialization Considerations

Hazelcast needs to serialize objects in order to be able to keep them in the server memory. For primitive types, it uses Hazelcast native serialization. For other complex types (e.g. JS objects), it uses JSON serialization.

For example, when you try to query your data using predicates, this querying is handled on the server side so Hazelcast does not have to bring all data to the client but only the relevant entries. Otherwise, there would be a lot of unneccessary data traffic between the client and the server and the performance would severely drop.
Because predicates run on the server side, the server should be able to reason about your objects. That is why you need to implement serialization on the server side.

The same applies to MapStore. The server should be able to deserialize your objects in order to store them in MapStore.

Regarding arrays in a serializable object, you can use methods like `writeIntArray` if the array is of a primitive type.

If you have nested objects, these nested objects also need to be serializable. Register the serializers for nested objects and the method `writeObject` will not have any problem with finding a suitable serializer for and writing/reading the nested object.

If you have arrays of custom objects, you can serialize/deserialize them like the following:

```javascript
writeData(dataOutput) {
    ...
    dataOutput.writeInt(this.arrayOfCustomObjects);
    this.arrayOfCustomObjects.forEach(function(element) {
        dataOutput.writeObject(element);
    });
    ...
}

readData(dataInput) {
    ...
    var arrayOfCustomObjects = [];
    var lenOfArray = dataInput.readInt();
    for (i=0;i<lenOfArray;i++) {
        arrayOfCustomObjects.push(dataInput.readObject());
    }
    this.arrayOfCustomObjects = arrayOfCustomObjects;
    ...
}
```

# Setting Up Client Network

All network related configuration of Hazelcast Node.js Client is performed via the `network` element in the declarative configuration file, or in the object `ClientNetworkConfig` when using programmatic configuration. Let’s first give the examples for these two approaches. Then we will look at its sub-elements and attributes.

### Declarative Client Network Configuration

Here is an example of configuring network for Node.js Client declaratively.

```json
{
    "network": {
        "clusterMembers": [
            "10.1.1.21",
            "10.1.1.22:5703"
        ],
        "smartRouting": true,
        "redoOperation": true,
        "connectionTimeout": 6000,
        "connectionAttemptPeriod": 5000,
        "connectionAttemptLimit": 5
    }
}
```

### Programmatic Client Network Configuration

Here is an example of configuring network for Node.js Client programmatically.

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.networkConfig.addresses.push('10.1.1.21', '10.1.1.22:5703');
clientConfig.networkConfig.smartRouting = true;
clientConfig.networkConfig.redoOperation = true;
clientConfig.networkConfig.connectionTimeout = 6000;
clientConfig.networkConfig.connectionAttemptPeriod = 5000;
clientConfig.networkConfig.connectionAttemptLimit = 5;
```

## 1. Providing the Member Addresses

Address list is the initial list of cluster addresses to which the client will connect. The client uses this
list to find an alive member. Although it may be enough to give only one address of a member in the cluster
(since all members communicate with each other), it is recommended that you give the addresses for all the members.

**Declarative:**

```json
{
    "network": {
        "clusterMembers": [
            "10.1.1.21",
            "10.1.1.22:5703"
        ]
    }
}
```

**Programmatic:**

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.networkConfig.addresses.push('10.1.1.21', '10.1.1.22:5703');
```

If the port part is omitted, then 5701, 5702 and 5703 will be tried in random order.

You can specify multiple addresses with or without port information as seen above. The provided list is shuffled and tried in random order. Its default value is `localhost`.

## 2. Setting Smart Routing

Smart routing defines whether the client mode is smart or unisocket. See [Node.js Client Operation Modes section](#nodejs-client-operation-modes)
for the description of smart and unisocket modes.
 
The following are example configurations.

**Declarative:**

```json
{
    "network": {
        "smartRouting": true
    }
}
```

**Programmatic:**

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.networkConfig.smartRouting = true;
```

Its default value is `true` (smart client mode).

## 3. Enabling Redo Operation

It enables/disables redo-able operations. While sending the requests to related members, operations can fail due to various reasons. Read-only operations are retried by default. If you want to enable retry for the other operations, you can set the `redoOperation` to `true`.

**Declarative:**

```json
{
    "network": {
        "redoOperation": true
    }
}
```

**Programmatic:**

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.networkConfig.redoOperation = true;
```

Its default value is `false` (disabled).

## 4. Setting Connection Timeout

Connection timeout is the timeout value in milliseconds for members to accept client connection requests.
If server does not respond within the timeout, the client will retry to connect as many as `ClientNetworkConfig.connectionAttemptLimit` times.
 
The following are the example configurations.


**Declarative:**

```json
{
    "network": {
        "connectionTimeout": 6000
    }
}
```

**Programmatic:**

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.networkConfig.connectionTimeout = 6000;
```

Its default value is `5000` milliseconds.

## 5. Setting Connection Attempt Limit

While the client is trying to connect initially to one of the members in the `ClientNetworkConfig.addresses`, that member might not be available at that moment. Instead of giving up, throwing an error and stopping the client, the client will retry as many as `ClientNetworkConfig.connectionAttemptLimit` times. This is also the case when the previously established connection between the client and that member goes down.

The following are example configurations.

**Declarative:**

```json
{
    "network": {
        "connectionAttemptLimit": 5
    }
}
```

**Programmatic:**

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.networkConfig.connectionAttemptLimit = 5;
```

Its default value is `2`.

## 6. Setting Connection Attempt Period

Connection timeout period is the duration in milliseconds between the connection attempts defined by `ClientNetworkConfig.connectionAttemptLimit`.
 
The following are example configurations.

**Declarative:**

```json
{
    "network": {
        "connectionAttemptPeriod": 5000
    }
}
```

**Programmatic:**

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.networkConfig.connectionAttemptPeriod = 5000;
```

Its default value is `3000` milliseconds.

## 7. Enabling Hazelcast Cloud Discovery

The purpose of Hazelcast Cloud Discovery is to provide clients to use IP addresses provided by `hazelcast orchestrator`. To enable Hazelcast Cloud Discovery, specify a token for the `discoveryToken` field and set the `enabled` field to `true`.
 
The following are example configurations.

**Declarative:**

```json
{
 "group": {
        "name": "hazel",
        "password": "cast"
    },

    "network": {
        "hazelcastCloud": {
            "discoveryToken": "EXAMPLE_TOKEN",
            "enabled": true
        }
    }
}

```

**Programmatic:**

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.groupConfig.name = 'hazel';
clientConfig.groupConfig.password = 'cast';

clientConfig.networkConfig.cloudConfig.enabled = true;
clientConfig.networkConfig.cloudConfig.discoveryToken = 'EXAMPLE_TOKEN';
```

To be able to connect to the provided IP addresses, you should use secure TLS/SSL connection between the client and members. Therefore, you should set an SSL configuration as described in the previous section.


# Using Node.js Client with Hazelcast IMDG

## 1. Node.js Client API Overview

Most of the functions in the API return `Promise`. Therefore, you need to be familiar with the concept of promises to use the Node.js client. If not, you can learn about them using various online resources.

Promises provide a better way of working with callbacks. You can chain asynchronous functions by `then()` function of promise. Also, you can use `async/await`, if you use Node.js 8 and higher versions.

If you are ready to go, let's start to use Hazelcast Node.js client!

The first step is configuration. You can configure the Node.js client declaratively or programmatically. We will use the programmatic approach throughout this chapter. Please refer to the [Node.js Client Declarative Configuration section](#declarative-configuration) for details.

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.groupConfig.name = 'dev';
clientConfig.networkConfig.addresses.push('10.90.0.1', '10.90.0.2:5702');
```

The second step is to initialize the `HazelcastClient` to be connected to the cluster.

```javascript
Client.newHazelcastClient(clientConfig).then(function (client) {
    // some operation
});
```

**This client object is your gateway to access all Hazelcast distributed objects.**

Let’s create a map and populate it with some data.

```javascript
var client;
var mapCustomers;
Client.newHazelcastClient(clientConfig).then(function (res) {
    client = res;
    mapCustomers = client.getMap('customers'); // creates the map proxy
    return mapCustomers.put('1', new Customer('Furkan', 'Senharputlu'));
}).then(function () {
    return mapCustomers.put('2', new Customer("Joe", "Smith"));
}).then(function () {
    return mapCustomers.put('3', new Customer("Muhammet", "Ali"));
});
```

As a final step, if you are done with your client, you can shut it down as shown below. This will release all the used resources and will close connections to the cluster.

```javascript
...
.then(function () {
    client.shutdown();
});
```

## 2. Using Distributed Data Structures

Most of the Distributed Data Structures are supported by the Node.js client. In this chapter, you will learn how to use these distributed data structures.

## 2.1. Using Map

A Map usage example is shown below.

```javascript
var map = client.getMap('myMap');

map.put(1, 'Furkan').then(function (oldValue) {
    return map.get(1);
}).then(function (value) {
    console.log(value); // Furkan
    return map.remove(1);
});
```

## 2.2. Using MultiMap

A MultiMap usage example is shown below.

```javascript
var multiMap = client.getMultiMap('myMultiMap');
        
multiMap.put(1, 'Furkan').then(function () {
    return multiMap.put(1, 'Mustafa');
}).then(function () {
    return multiMap.get(1);
}).then(function (values) {
    console.log(values.get(0), values.get(1)); // Furkan Mustafa
});
```

## 2.3. Using ReplicatedMap

A ReplicatedMap usage example is shown below.

```javascript
var replicatedMap = client.getReplicatedMap('myReplicatedMap');

replicatedMap.put(1, 'Furkan').then(function () {
    return replicatedMap.put(2, 'Ahmet');
}).then(function () {
    return replicatedMap.get(2);
}).then(function (value) {
    console.log(value); // Ahmet
});
```

## 2.4. Using Queue

A Queue usage example is shown below.

```javascript
var queue = client.getQueue('myQueue');

queue.offer('Furkan').then(function () {
    return queue.peek();
}).then(function (head) {
    console.log(head); // Furkan
});
```

# Development

## Building And Installing from Sources

Follow the below steps to build and install Hazelcast Node.js client from its source:

- Clone the GitHub repository [https://github.com/hazelcast/hazelcast-nodejs-client.git](https://github.com/hazelcast/hazelcast-nodejs-client.git).
- Install the dependencies using the command `npm install`.
- Compile TypeScript using the command `npm run compile`.
- Link the package locally using the command `npm link`.
- Run static analysis tool using the command `npm run lint`

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

Hazelcast is available under the Apache 2 License. Please see the [Licensing appendix](http://docs.hazelcast.org/docs/latest/manual/html-single/index.html#license-questions) for more information.

# Copyright

Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.

Visit [www.hazelcast.com](http://www.hazelcast.com) for more information.
