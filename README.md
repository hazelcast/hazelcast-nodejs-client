# Table of Contents

* [Hazelcast Node.js Client](#hazelcast-nodejs-client)
* [Features](#features)
* [Installing the Client](#installing-the-client)
* [Using the Client](#using-the-client)
* [Code Samples](#code-samples)
* [Serialization Considerations](#serialization-considerations)
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

# Configuration

You can configure Hazelcast Node.js Client declaratively (JSON) or programmatically (API).

See [CONFIG.md](CONFIG.md) for details.

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
