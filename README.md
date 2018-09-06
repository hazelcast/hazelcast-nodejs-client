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

# Getting Started

This part explains all the neccessary things to start using Hazelcast Node.js Client including basic Hazelcast IMDG, IMDG and client
configuration and how to use distributed maps with Hazelcast.

## Requirements

1. Windows, Linux or MacOS
1. Node.js >= 4
2. Java >= 6
3. Hazelcast IMDG >= 3.6
4. Latest Hazelcast Node.js Client

## Working with Hazelcast Clusters

Hazelcast Node.js Client requires a working Hazelcast IMDG cluster to run. IMDG cluster handles storage and manipulation of user data.
Clients are a way to connect to IMDG cluster and access such data.

IMDG cluster consists of one or more Hazelcast IMDG members. These members generally run on multiple virtual or physical machines
and are connected to each other via network. Any data put on the cluster is partitioned to multiple members transparent to the user.
It is therefore very easy to scale the system by adding new members as the data grows. IMDG cluster also offers resilience. Should
any hardware or software problem causes a crash to any member, the data on that member is recovered from backups and the cluster
continues to operate without any downtime. Hazelcast clients are an easy way to connect to an IMDG cluster and perform tasks on
distributed data structures that live on the cluster.

In order to use Hazelcast Node.js Client, we first need to setup an IMDG cluster.

### Setting up an IMDG cluster
There are multiple ways of starting an IMDG cluster easily. You can run standalone IMDG members by downloading and running jar files
from the website. You can embed IMDG members to your Java projects. The easiest way is to use [hazelcast-member tool](https://github.com/hazelcast/hazelcast-member-tool)
if you have brew installed in your computer. We are going to download jars from the website and run a standalone member for this guide.

#### Running standalone jars
Go to https://hazelcast.org/download/ and download `.zip` or `.tar` distribution. Decompress the contents into any directory that you
want to run IMDG members from. Change into the directory that you decompressed hazelcast content. Go into `bin` directory. Use either
`start.sh` or `start.bat` depending on your operating system. Once you run the start script, you should see IMDG logs on the terminal.
Once you see some log similar to the following, your 1-member cluster is ready to use:
```
INFO: [192.168.0.3]:5701 [dev] [3.10.4]

Members {size:1, ver:1} [
	Member [192.168.0.3]:5701 - 65dac4d1-2559-44bb-ba2e-ca41c56eedd6 this
]

Sep 06, 2018 10:50:23 AM com.hazelcast.core.LifecycleService
INFO: [192.168.0.3]:5701 [dev] [3.10.4] [192.168.0.3]:5701 is STARTED
```


#### Using hazelcast-member tool
hazelcast-member is a tool to make downloading and running IMDG members as easy as it could be. If you have brew installed, just run
```
brew tap hazelcast/homebrew-hazelcast
brew install hazelcast-member
hazelcast-member start
```
In order to stop the member later, just type
```
hazelcast-member stop
```
Find more information about hazelcast-member tool at https://github.com/hazelcast/hazelcast-member-tool

Please refer to official [hazelcast documentation](http://docs.hazelcast.org/docs/3.10.4/manual/html-single/index.html#getting-started) for more information regarding starting clusters.

# Downloading and Installing
Hazelcast Node.js Client is on NPM. Just add `hazelcast-client` as a dependency to your Node.js project and you are good to go.
```
npm install hazelcast-client --save
```

# Basic Configuration
If you are using Hazelcast IMDG and Node.js Client on the same computer, generally default configuration just works. This is great for
trying out the client and experimenting. However, if you run the client on a different computer than any of the cluster members, you may
need to do some simple configuration such as member addresses.

IMDG members and the clients has their own configuration options. You may need to reflect some configuration options that you made on member
side to client side in order to connect to the cluster. This section describes the most common configuration elements to get you started in no time.
It discusses some member side configuration options to ease understanding Hazelcast's ecosystem. Then, client side configuration options
regarding cluster connection are discussed. Configuration material regarding data structures are discussed in the following sections.
You can refer to [IMDG Documentation](https://hazelcast.org/documentation/) and [CONFIG.md](CONFIG.MD) for more information.

## IMDG Configuration
There are two ways to configure Hazelcast IMDG. One is to use a `hazelcast.xml` file and the other is to programmatically configure the
instance before starting it from Java code. Since we use standalone servers, we will use `hazelcast.xml` to configure our cluster members.

When you download and unzip hazelcast-<version>.zip, you see the `hazelcast.xml` in /bin folder. When a Hazelcast member starts, it looks for
`hazelcast.xml` file to load configuration from. In `hazelcast.xml` file, you will see the default configuration. We will go over some important
elements here:

- `<group>`: This tag specifies to which cluster this member belongs to. A member only connects to other members that are in the same group as
itself. You will see `<name>` and `<password>` tags with some preconfigured values. You may give your clusters different names so that they can
live in the same network without disturbing each other. Note that the cluster name should be the same across all members and clients that belong
 to the same cluster. `<password>` tag is not in use since Hazelcast 3.9. It is there for backward compatibility
purposes. You can remove or leave it as it is if you use Hazelcast 3.9 or later.
- `<network>`
    - `<port>`: This specifies the port number that the member will use when it starts. You can specify a port number. If you set `auto-increment`
    to `true`, than Hazelcast will try subsequent ports until it finds an available port or `port-count` is reached.
    - `<join>`: This tag specifies the strategies that member uses to find other members of the cluster. Choose which strategy you want to
    use by setting its `enabled` attribute to `true` and the others to `false`.
        - `<multicast>`: Members find each other by sending multicast requests to the specified address and port. It is very useful if ip addresses
        of the members are not static.
        - `<tcp>`: This strategy uses a pre-configured list of known members to find and already existing cluster. It is enough for a member to
        find only one cluster member to connect to the cluster. The rest of the member list is automatically retrieved from that member. We recommend
        putting multiple known member addresses there to avoid disconnectivity should one of the members in the list is unavailable at the time
        of connection.

These configuration elements are enough for most connection scenarios. Now we will move onto configuration of the Node.js client.

## Hazelcast Client Configuration
There are two ways to configure a Hazelcast Node.js Client:
- Programmatically
- Declaratively (JSON)

This section describes some network configuration settings to cover common use cases in connecting the client to a cluster. Refer to (CONFIG.md)
and the following sections for information about detailed network configuration and/or additional features of Hazelcast Node.js Client
configuration.

An easy way to configure your Hazelcast Node.js Client is to create a `Config` object and set the appropriate options. Then you can
supply this object to your client at the startup. Another way to configure your client is to provide a `hazelcast-client.json` file. This approach is similar to `hazelcast.xml` approach
in configuring the member. Note that `hazelcast-client.json` is a JSON file whereas member configuration is XML based. Although these
two formats are different, you will realize that the names of the configuration parameters are the same for both client and the member.
It is done this way to make it easier to transfer Hazelcast skills to multiple platforms easily.

Once you embedded hazelcast-client to your Node.js project. You may follow any of programmatic or declarative configuration approaches.
We will provide both ways for each configuration option in this section. Pick one way and stick to it.

---

**Programmatic configuration**
You need to create a `ClientConfig` object and adjust its properties. Then you can pass this object to the client when starting it.

```javascript
let Client = require('hazelcast-client').Client;
let Config = require('hazelcast-client').Config;
let cfg = new Config.ClientConfig();
Client.newHazelcastClient(cfg)
```

**Declarative configuration**
Hazelcast Node.js Client looks for a `hazelcast-client.json` in the current working directory unless you provide a configuration object
at the startup. If you intend to configure your client using a configuration file, then place a `hazelcast-client.json` in the directory
of your application's entry point.

If you prefer to keep your `hazelcast-client.json` file somewhere else, you can override the environment variable `HAZELCAST_CLIENT_CONFIG`
with the location of your config file. In this case, the client uses the configuration file specified in the environment variable.

For the structure of `hazelcast-client.json`, take a look at [hazelcast-client-full.json](test/config/hazelcast-client-full.json). You
can use only the relevant parts of the file in your `hazelcast-client.json` and remove the rest. Default configuration is used for any
part that you do not explicitly set in `hazelcast-client.json`.

---

If you run Hazelcast IMDG members in a different server than the client, you most probably have configured the members' ports and cluster
names as explained in the previous section. If you did, then you need to make certain changes to network settings of your client.

### Group Settings

- Programmatic
```
let cfg = new Config.ClientConfig();
cfg.group.name = //group name of you cluster
```

- Declarative
```
{
    "group": {
        "name": "group name of you cluster"
    }
}
```

### Network Settings
You need to provide the ip address and port of at least one member in your cluster so the client finds it.
- Programmatic
```
let cfg = new Config.ClientConfig();
cfg.network.addresses.push('some-ip-address:port');
```
- Declarative
```
{
    "network": {
        "clusterMembers": [
            "some-ip-address:port"
        ],
    }
}

## Basic Usage
Now that we have a working cluster and we know how to configure both our cluster and client, we can run a simple program to use a
distributed map in Node.js

The following example first creates a programmatic configuration object. Then, it starts a client.

```javascript
let Client = require('hazelcast-client').Client;
let Config = require('hazelcast-client').Config;
let config = new Config.ClientConfig(); // We create a config for illustrative purposes.
                                        // We do not adjust this config. Therefore it has default settings.

Client.newHazelcastClient(config).then(function(client) {
    console.log(client.getLocalEndpoint()); // Connects and prints some information about this client
});
```
This should print logs about the cluster members and information about the client itself such as client type, uuid and address.
```
[DefaultLogger] INFO at ConnectionAuthenticator: Connection to 192.168.0.3:5701 authenticated
[DefaultLogger] INFO at ClusterService: Members received.
[ Member {
    address: Address { host: '192.168.0.3', port: 5701, type: 4 },
    uuid: '05db1504-4f23-426b-9e8a-c9db587ad0d6',
    isLiteMember: false,
    attributes: {} } ]
[DefaultLogger] INFO at HazelcastClient: Client started
ClientInfo {
  type: 'NodeJS',
  uuid: '532e8479-2b86-47f9-a0fb-a2da13a8d584',
  localAddress: Address { host: '127.0.0.1', port: 51903, type: 4 } }
```
Congratulations, you just started a Hazelcast Node.js Client.

**Using a map**

Let us manipulate a distributed map on a cluster using the client.

Save the following file as `IT.js` and run it using `node IT.js`
**IT.js**
```javascript
let Client = require('hazelcast-client').Client;
let Config = require('hazelcast-client').Config;
let config = new Config.ClientConfig();

Client.newHazelcastClient(config).then(function(client) {
    let personnelMap = client.getMap('personnelMap');
    return personnelMap.put('Alice', 'IT').then(function () {
        return personnelMap.put('Bob', 'IT');
    }).then(function () {
        return personnelMap.put('Clark', 'IT');
    }).then(function () {
        console.log("Added IT personnel. Logging all known personnel");
        return personnelMap.entrySet();
    }).then(function (allPersonnel) {
        allPersonnel.forEach(function (person) {
            console.log(person[0] + ' is in ' + person[1] + ' department');
        });
        return client.shutdown();
    });
});
```
**Output**
```
[DefaultLogger] INFO at HazelcastClient: Client started
Added IT personnel. Logging all known personnel
Alice is in IT department
Clark is in IT department
Bob is in IT department
```

You see this example puts all IT personnel into a cluster-wide `personnelMap` and then prints all known personnel.

Now create `Sales.js` and run it using `node Sales.js`
**Sales.js**
```javascript
let Client = require('hazelcast-client').Client;
let Config = require('hazelcast-client').Config;
let config = new Config.ClientConfig();

Client.newHazelcastClient(config).then(function(client) {
    let personnelMap = client.getMap('personnelMap');
    return personnelMap.put('Denise', 'Sales').then(function () {
        return personnelMap.put('Erwing', 'Sales');
    }).then(function () {
        return personnelMap.put('Faith', 'Sales');
    }).then(function () {
        console.log("Added Sales personnel. Logging all known personnel");
        return personnelMap.entrySet();
    }).then(function (allPersonnel) {
        allPersonnel.forEach(function (person) {
            console.log(person[0] + ' is in ' + person[1] + ' department');
        });
        return client.shutdown();
    });
});
```
**Output**
```
[DefaultLogger] INFO at HazelcastClient: Client started
Added Sales personnel. Logging all known personnel
Denise is in Sales department
Erwing is in Sales department
Faith is in Sales department
Alice is in IT department
Clark is in IT department
Bob is in IT department

```

You will see this time we add only the sales employees but we get the list all known employees including the ones in IT.
That is because our map lives in the cluster and no matter which client we use, we can access the whole map.

# Configuration Overview

This chapter describes the options to configure your Node.js client and explains how you can import multiple configurations
and how you should set paths and exported names for the client to load objects.

## 1. Configuration Options

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


## Code Samples
Please see Hazelcast Node.js [code samples](https://github.com/hazelcast/hazelcast-nodejs-client/tree/master/code_samples) for more examples.

You can also refer to Hazelcast Node.js [API Documentation](http://hazelcast.github.io/hazelcast-nodejs-client/api/current/docs/).

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
