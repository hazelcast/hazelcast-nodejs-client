[![Join the chat at https://gitter.im/hazelcast-incubator/hazelcast-nodejs-client](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/hazelcast-incubator/hazelcast-nodejs-client?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

# Table of Contents

* [Introduction](#introduction)
* [1. Getting Started](#1-getting-started)
  * [1.1. Requirements](#11-requirements)
  * [1.2. Working with Hazelcast Clusters](#12-working-with-hazelcast-clusters)
  * [1.3. Downloading and Installing](#13-downloading-and-installing)
  * [1.4. Basic Configuration](#14-basic-configuration)
    * [1.4.1. IMDG Configuration](#141-imdg-configuration)
    * [1.4.2. Hazelcast Client Configuration](#142-hazelcast-client-configuration)
  * [1.5. Basic Usage](#15-basic-usage)
  * [1.6. Code Samples](#16-code-samples)
* [2. Features](#2-features)
* [3. Configuration Overview](#3-configuration-overview)
  * [3.1. Configuration Options](#31-configuration-options)
    * [3.1.1. Programmatic Configuration](#311-programmatic-configuration)
    * [3.1.2. Declarative Configuration (JSON)](#312-declarative-configuration-json)
  * [3.2. Importing Multiple Configurations](#32-importing-multiple-configurations)
  * [3.3. Loading Objects and Path Resolution](#33-loading-objects-and-path-resolution)
* [4. Serialization](#4-serialization)
  * [4.1. IdentifiedDataSerializable Serialization](#41-identifieddataserializable-serialization)
  * [4.2. Portable Serialization](#42-portable-serialization)
  * [4.3. Custom Serialization](#43-custom-serialization)
  * [4.4. Global Serialization](#44-global-serialization)
* [5. Setting Up Client Network](#5-setting-up-client-network)
  * [5.1. Providing the Member Addresses](#51-providing-the-member-addresses)
  * [5.2. Setting Smart Routing](#52-setting-smart-routing)
  * [5.3. Setting Redo Operation](#53-enabling-redo-operation)
  * [5.4. Setting Connection Timeout](#54-setting-connection-timeout)
  * [5.5. Setting Connection Attempt Limit](#55-setting-connection-attempt-limit)
  * [5.6. Setting Connection Attempt Period](#56-setting-connection-attempt-period)
  * [5.7. Enabling Client TLS/SSL](#57-enabling-client-tlsssl)
  * [5.8. Enabling Hazelcast Cloud Discovery](#58-enabling-hazelcast-cloud-discovery)
* [6. Securing Client Connection](#6-securing-client-connection)
  * [6.1. TLS/SSL](#61-tlsssl)
    * [6.1.1. TLS/SSL for Hazelcast Members](#611-tlsssl-for-hazelcast-members)
    * [6.1.2. TLS/SSL for Hazelcast Node.js Clients](#612-tlsssl-for-hazelcast-nodejs-clients)
    * [6.1.3. Mutual Authentication](#613-mutual-authentication)
* [7. Using Node.js Client with Hazelcast IMDG](#7-using-nodejs-client-with-hazelcast-imdg)
  * [7.1. Node.js Client API Overview](#71-nodejs-client-api-overview)
  * [7.2. Node.js Client Operation Modes](#72-nodejs-client-operation-modes)
      * [7.2.1. Smart Client](#721-smart-client)
      * [7.2.2. Unisocket Client](#722-unisocket-client)
  * [7.3. Handling Failures](#73-handling-failures)
    * [7.3.1. Handling Client Connection Failure](#731-handling-client-connection-failure)
    * [7.3.2. Handling Retry-able Operation Failure](#732-handling-retry-able-operation-failure)
  * [7.4. Using Distributed Data Structures](#74-using-distributed-data-structures)
    * [7.4.1. Using Map](#741-using-map)
    * [7.4.2. Using MultiMap](#742-using-multimap)
    * [7.4.3. Using ReplicatedMap](#743-using-replicatedmap)
    * [7.4.4. Using Queue](#744-using-queue)
  * [7.5. Distributed Events](#75-distributed-events)
    * [7.5.1. Cluster Events](#751-cluster-events)
      * [7.5.1.1. Listening for Member Events](#7511-listening-for-member-events)
      * [7.5.1.2. Listening for Distributed Object Events](#7512-listening-for-distributed-object-events)
      * [7.5.1.3. Listening for Lifecycle Events](#7513-listening-for-lifecycle-events)
    * [7.5.2. Distributed Data Structure Events](#752-distributed-data-structure-events)
      * [7.5.2.1. Listening for Map Events](#7521-listening-for-map-events)
* [8. Development and Testing](#8-development-and-testing)
  * [8.1. Building and Using Client From Sources](#81-building-and-using-client-from-sources)
  * [8.2. Testing](#82-testing)
* [9. Getting Help](#9-getting-help)
* [10. Contributing](#10-contributing)
* [11. License](#11-license)
* [12. Copyright](#12-copyright)


# Introduction

This document provides information about the Node.js client for [Hazelcast](https://hazelcast.org/). This client uses Hazelcast's [Open Client Protocol](https://hazelcast.org/documentation/#open-binary) and works with Hazelcast IMDG 3.6 and higher versions.

### Resources

See the following for more information on Node.js and Hazelcast IMDG:

* Hazelcast IMDG [website](https://hazelcast.org/)
* Hazelcast IMDG [Reference Manual](https://hazelcast.org/documentation/#imdg)
* About [Node.js](https://nodejs.org/en/about/)

### Release Notes

You can see the release notes for each Node.js client release on the [Releases](https://github.com/hazelcast/hazelcast-nodejs-client/releases) page of this repository.	


# 1. Getting Started

This chapter explains all the necessary things to start using Hazelcast Node.js client including basic Hazelcast IMDG and client
configuration and how to use distributed maps with Hazelcast.

## 1.1. Requirements

- Windows, Linux or MacOS
- Node.js 4 or newer
- Java 6 or newer
- Hazelcast IMDG 3.6 or newer
- Latest Hazelcast Node.js client

## 1.2. Working with Hazelcast Clusters

Hazelcast Node.js client requires a working Hazelcast IMDG cluster to run. IMDG cluster handles storage and manipulation of the user data.
Clients are a way to connect to IMDG cluster and access such data.

IMDG cluster consists of one or more Hazelcast IMDG members. These members generally run on multiple virtual or physical machines
and are connected to each other via network. Any data put on the cluster is partitioned to multiple members transparent to the user.
It is therefore very easy to scale the system by adding new members as the data grows. IMDG cluster also offers resilience. Should
any hardware or software problem causes a crash to any member, the data on that member is recovered from backups and the cluster
continues to operate without any downtime. Hazelcast clients are an easy way to connect to an IMDG cluster and perform tasks on
distributed data structures that live on the cluster.

In order to use Hazelcast Node.js client, we first need to setup an IMDG cluster.

### Setting Up an IMDG Cluster

There are multiple ways of starting an IMDG cluster easily. You can run standalone IMDG members by downloading and running jar files
from the website. You can embed IMDG members to your Java projects. The easiest way is to use [hazelcast-member tool](https://github.com/hazelcast/hazelcast-member-tool)
if you have brew installed in your computer. We are going to download jars from the website and run a standalone member for this guide.

#### Running Standalone Jars

Go to https://hazelcast.org/download/ and download `.zip` or `.tar` distribution of Hazelcast IMDG. Decompress the contents into any directory that you
want to run IMDG members from. Change into the directory that you decompressed the Hazelcast content. Go into `bin` directory. Use either
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


#### Using hazelcast-member Tool

`hazelcast-member` is a tool to make downloading and running IMDG members as easy as it could be. If you have brew installed, run the following commands:
```
brew tap hazelcast/homebrew-hazelcast
brew install hazelcast-member
hazelcast-member start
```
In order to stop the member, run the following command:
```
hazelcast-member stop
```
Find more information about `hazelcast-member` tool at https://github.com/hazelcast/hazelcast-member-tool

Refer to the official [Hazelcast IMDG Reference Manual](http://docs.hazelcast.org/docs/latest/manual/html-single/index.html#getting-started) for more information regarding starting clusters.

## 1.3. Downloading and Installing

Hazelcast Node.js client is on NPM. Just add `hazelcast-client` as a dependency to your Node.js project and you are good to go.
```
npm install hazelcast-client --save
```

## 1.4. Basic Configuration

If you are using Hazelcast IMDG and Node.js Client on the same computer, generally default configuration just works. This is great for
trying out the client. However, if you run the client on a different computer than any of the cluster members, you may
need to do some simple configuration such as specifying the member addresses.

The IMDG members and clients have their own configuration options. You may need to reflect some of the member side configurations on the client side to properly connect to the cluster.
This section describes the most common configuration elements to get you started in no time.
It discusses some member side configuration options to ease understanding Hazelcast's ecosystem. Then, client side configuration options
regarding cluster connection are discussed. Configuration material regarding data structures are discussed in the following sections.
You can refer to [IMDG Documentation](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html) and [Configuration Overview](#configuration-overview) for more information.

### 1.4.1. IMDG Configuration

Hazelcast IMDG aims to run out of the box for most common scenarios. However if you have limitations on your network such as multicast being disabled,
you may have to configure your Hazelcast IMDG instances so that they can find each other on the network. Also most data structures are configurable.
Therefore, you may want to configure your Hazelcast IMDG. We will show you the basics about network configuration here.

There are two ways to configure Hazelcast IMDG. One is to use a `hazelcast.xml` file and the other is to programmatically configure the
instance before starting it from Java code. Since we use standalone servers, we will use `hazelcast.xml` to configure our cluster members.

When you download and unzip `hazelcast-<version>.zip`, you see the `hazelcast.xml` in `bin` folder. When a Hazelcast member starts, it looks for
`hazelcast.xml` file to load configuration from. A sample `hazelcast.xml` is below. We will go over some important elements in the rest of this section.
```xml
<hazelcast>
    <group>
        <name>dev</name>
        <password>dev-pass</password>
    </group>
    <network>
        <port auto-increment="true" port-count="100">5701</port>
        <join>
            <multicast enabled="true">
                <multicast-group>224.2.2.3</multicast-group>
                <multicast-port>54327</multicast-port>
            </multicast>
            <tcp-ip enabled="false">
                <interface>127.0.0.1</interface>
                <member-list>
                    <member>127.0.0.1</member>
                </member-list>
            </tcp-ip>
        </join>
        <ssl enabled="false"/>
    </network>
    <partition-group enabled="false"/>
    <map name="default">
        <backup-count>1</backup-count>
    </map>
</hazelcast>
```

- `<group>`: Specifies which cluster this member belongs to. A member connects only to other members that are in the same group as
itself. You will see `<name>` and `<password>` tags with some pre-configured values. You may give your clusters different names so that they can
live in the same network without disturbing each other. Note that the cluster name should be the same across all members and clients that belong
 to the same cluster. `<password>` tag is not in use since Hazelcast 3.9. It is there for backward compatibility
purposes. You can remove or leave it as it is if you use Hazelcast 3.9 or later.
- `<network>`
    - `<port>`: Specifies the port number to be used by the member when it starts. Its default value is 5701 You can specify another port number, and if
     you set `auto-increment` to `true`, then Hazelcast will try subsequent ports until it finds an available port or `port-count` is reached.
    - `<join>`: Specifies the strategies to be used by the member to find other cluster members. Choose which strategy you want to
    use by setting its `enabled` attribute to `true` and the others to `false`.
        - `<multicast>`: Members find each other by sending multicast requests to the specified address and port. It is very useful if IP addresses
        of the members are not static.
        - `<tcp>`: This strategy uses a pre-configured list of known members to find an already existing cluster. It is enough for a member to
        find only one cluster member to connect to the cluster. The rest of the member list is automatically retrieved from that member. We recommend
        putting multiple known member addresses there to avoid disconnectivity should one of the members in the list is unavailable at the time
        of connection.

These configuration elements are enough for most connection scenarios. Now we will move onto configuration of the Node.js client.

### 1.4.2. Hazelcast Client Configuration

There are two ways to configure a Hazelcast Node.js client:

* Programmatically
* Declaratively (JSON)

This section describes some network configuration settings to cover common use cases in connecting the client to a cluster. Refer to [Configuration Overview](#configuration-overview)
and the following sections for information about detailed network configuration and/or additional features of Hazelcast Node.js client
configuration.

An easy way to configure your Hazelcast Node.js client is to create a `Config` object and set the appropriate options. Then you can
supply this object to your client at the startup. Another way to configure your client is to provide a `hazelcast-client.json` file. This approach is similar to `hazelcast.xml` approach
in configuring the member. Note that `hazelcast-client.json` is a JSON file whereas member configuration is XML based. Although these
two formats are different, you will realize that the names of the configuration parameters are the same for both the client and member.
It is done this way to make it easier to transfer Hazelcast skills to multiple platforms.

Once you embedded `hazelcast-client` to your Node.js project, you may follow any of programmatic or declarative configuration approaches.
We will provide both ways for each configuration option in this section. Pick one way and stick to it.

**Programmatic configuration**

You need to create a `ClientConfig` object and adjust its properties. Then you can pass this object to the client when starting it.

```javascript
let Client = require('hazelcast-client').Client;
let Config = require('hazelcast-client').Config;
let cfg = new Config.ClientConfig();
Client.newHazelcastClient(cfg)
```

**Declarative configuration**

Hazelcast Node.js client looks for a `hazelcast-client.json` in the current working directory unless you provide a configuration object
at the startup. If you intend to configure your client using a configuration file, then place a `hazelcast-client.json` in the directory
of your application's entry point.

If you prefer to keep your `hazelcast-client.json` file somewhere else, you can override the environment variable `HAZELCAST_CLIENT_CONFIG`
with the location of your config file. In this case, the client uses the configuration file specified in the environment variable.

For the structure of `hazelcast-client.json`, take a look at [hazelcast-client-full.json](test/config/hazelcast-client-full.json). You
can use only the relevant parts of the file in your `hazelcast-client.json` and remove the rest. Default configuration is used for any
part that you do not explicitly set in `hazelcast-client.json`.

---

If you run Hazelcast IMDG members in a different server than the client, you most probably have configured the members' ports and cluster
names as explained in the previous section. If you did, then you need to make certain changes to the network settings of your client.

### Group Settings

**Programmatic:**
```javascript
let cfg = new Config.ClientConfig();
cfg.group.name = //group name of you cluster
```

**Declarative:**
```json
{
    "group": {
        "name": "group name of you cluster"
    }
}
```

### Network Settings

You need to provide the ip address and port of at least one member in your cluster so the client finds it.

**Programmatic:**
```javascript
let cfg = new Config.ClientConfig();
cfg.network.addresses.push('some-ip-address:port');
```

**Declarative:**
```json
{
    "network": {
        "clusterMembers": [
            "some-ip-address:port"
        ],
    }
}
```

## 1.5. Basic Usage

Now that we have a working cluster and we know how to configure both our cluster and client, we can run a simple program to use a
distributed map in Node.js client.

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
Congratulations, you just started a Hazelcast Node.js client.

**Using a Map**

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

## 1.6. Code Samples

Please see Hazelcast Node.js [code samples](https://github.com/hazelcast/hazelcast-nodejs-client/tree/master/code_samples) for more examples.

You can also refer to Hazelcast Node.js [API Documentation](http://hazelcast.github.io/hazelcast-nodejs-client/api/current/docs/).

# 2. Features

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

# 3. Configuration Overview

This chapter describes the options to configure your Node.js client and explains how you can import multiple configurations
and how you should set paths and exported names for the client to load objects.

## 3.1. Configuration Options

You can configure Hazelcast Node.js client declaratively (JSON) or programmatically (API).

* Programmatic configuration
* Declarative configuration (JSON file)

### 3.1.1. Programmatic Configuration

For programmatic configuration of the Hazelcast Node.js client, just instantiate a `ClientConfig` object and configure the
desired aspects. An example is shown below.

```javascript
var Config = require('hazelcast-client').Config;
var Address = require('hazelcast-client').Address;
var cfg = new Config.ClientConfig();
cfg.networkConfig.addresses.push('127.0.0.1:5701');
return HazelcastClient.newHazelcastClient(cfg);
```

Refer to `ClientConfig` class documentation at [Hazelcast Node.js Client API Docs](http://hazelcast.github.io/hazelcast-nodejs-client/api/current/docs) for details.

### 3.1.2. Declarative Configuration (JSON)

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

## 3.2. Importing Multiple Configurations

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

## 3.3. Loading Objects and Path Resolution

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


# 4. Serialization

Serialization is the process of converting an object into a stream of bytes to store the object in memory, a file or database, or transmit it through network. Its main purpose is to save the state of an object in order to be able to recreate it when needed. The reverse process is called deserialization. Hazelcast offers you its own native serialization methods. You will see these methods throughout the chapter.

Hazelcast serializes all your objects before sending them to the server. The `boolean`, `number`,`string` and `Long` types are serialized natively and you cannot override this behavior. The following table is the conversion of types for Java server side.

| Node.js | Java                                |
|---------|-------------------------------------|
| boolean | Boolean                             |
| number  | Byte, Short, Integer, Float, Double |
| string  | String                              |
| Long    | Long                                |

> Note: A `number` type is serialized as `Double` by default. You can configure this behavior from `SerializationConfig.defaultNumberType`.

Arrays of the above types can be serialized as `boolean[]`, `byte[]`, `short[]`, `int[]`, `float[]`, `double[]`, `long[]` and `string[]` for Java server side respectively. 

Note that if the object is not one of the above-mentioned types, the Node.js client uses `JSON Serialization` by default.

However, `JSON Serialization` is not the best way of serialization in terms of performance and interoperability between the clients in different languages. If you want the serialization to work faster or you use the clients in different languages, Hazelcast offers its own native serialization types, such as [IdentifiedDataSerializable Serialization](#1-identifieddataserializable-serialization) and [Portable Serialization](#2-portable-serialization).

On top of all, if you want to use your own serialization type, you can use a [Custom Serialization](#3-custom-serialization).

> **NOTE: Hazelcast Node.js client is a TypeScript-based project but JavaScript does not have interfaces. Therefore, 
 some interfaces are given to user by using the TypeScript files that have `.ts` extension. In the documentation, implementing an interface means an object to have the necessary functions that are listed in the interface inside the `.ts` file. Also, this object is mentioned as `an instance of the interface`. You can search the [API Documentation](http://hazelcast.github.io/hazelcast-nodejs-client/api/current/docs/) or Github repository for a required interface.**

## 4.1. IdentifiedDataSerializable Serialization

For a faster serialization of objects, Hazelcast recommends to implement IdentifiedDataSerializable interface.

Here is an example of an object implementing IdentifiedDataSerializable interface:

```javascript
function Address(street, zipCode, city, state) {
    this.street = street;
    this.zipCode = zipCode;
    this.city = city;
    this.state = state;
}

Address.prototype.getClassId = function () {
    return 1;
};

Address.prototype.getFactoryId = function () {
    return 1;
};

Address.prototype.writeData = function (objectDataOutput) {
    objectDataOutput.writeUTF(this.street);
    objectDataOutput.writeInt(this.zipCode);
    objectDataOutput.writeUTF(this.city);
    objectDataOutput.writeUTF(this.state);
};

Address.prototype.readData = function (objectDataInput) {
    this.street = objectDataInput.readUTF();
    this.zipCode = objectDataInput.readInt();
    this.city = objectDataInput.readUTF();
    this.state = objectDataInput.readUTF();
};
```

IdentifiedDataSerializable uses `getClassId()` and `getFactoryId()` to reconstitute the object. To complete the implementation `IdentifiedDataSerializableFactory` should also be implemented and registered into `SerializationConfig` which can be accessed from `Config.serializationConfig`. The factory's responsibility is to return an instance of the right `IdentifiedDataSerializable` object, given the class id. 

A sample `IdentifiedDataSerializableFactory` could be implemented as following:

```javascript
function MyIdentifiedFactory() {

}

MyIdentifiedFactory.prototype.create = function (type) {
    if (type === 1) {
        return new Address();
    }
};
```

The last step is to register the `IdentifiedDataSerializableFactory` to the `SerializationConfig`.

**Programmatic Configuration:**
```javascript
var config = new Config.ClientConfig();
config.serializationConfig.dataSerializableFactories[1] = new MyIdentifiedFactory();
```

**Declarative Configuration:**
```json
{
    "serialization": {
        "dataSerializableFactories": [
            {
                "path": "address.js",
                "exportedName": "MyIdentifiedFactory",
                "factoryId": 1
            }
        ]
    }
}
```

Note that the id that is passed to the `SerializationConfig` is same as the `factoryId` that `Address` object returns.

## 4.2. Portable Serialization

As an alternative to the existing serialization methods, Hazelcast offers Portable serialization. To use it, you need to implement `Portable` interface. Portable serialization has the following advantages:

- Supporting multiversion of the same object type
- Fetching individual fields without having to rely on reflection
- Querying and indexing support without de-serialization and/or reflection

In order to support these features, a serialized Portable object contains meta information like the version and the concrete location of the each field in the binary data. This way Hazelcast is able to navigate in the binary data and de-serialize only the required field without actually de-serializing the whole object which improves the Query performance.

With multiversion support, you can have two nodes where each of them having different versions of the same object and Hazelcast will store both meta information and use the correct one to serialize and de-serialize Portable objects depending on the node. This is very helpful when you are doing a rolling upgrade without shutting down the cluster.

Also note that Portable serialization is totally language independent and is used as the binary protocol between Hazelcast server and clients.

A sample Portable implementation of a `Foo` class will look like the following:

```javascript
function Foo(foo) {
    this.foo = foo;
}

Foo.prototype.getClassId = function () {
    return 1;
};

Foo.prototype.getFactoryId = function () {
    return 1;
};

Foo.prototype.writePortable = function (portableWriter) {
    portableWriter.writeUTF('foo', this.foo);
};

Foo.prototype.readPortable = function (portableReader) {
    this.foo = portableReader.readUTF('foo');
};
```

Similar to `IdentifiedDataSerializable`, a Portable object must provide `classId` and `factoryId`. The factory object will be used to create the Portable object given the classId.

A sample `PortableFactory` could be implemented as following:

```javascript
function MyPortableFactory() {

}

MyPortableFactory.prototype.create = function (type) {
    if (type === 1) {
        return new Foo();
    }
};
```

The last step is to register the `PortableFactory` to the `SerializationConfig`.

**Programmatic Configuration:**
```javascript
var config = new Config.ClientConfig();
config.serializationConfig.portableFactories[1] = new MyPortableFactory();
```

**Declarative Configuration:**
```json
{
    "serialization": {
        "portableFactories": [
            {
                "path": "foo.js",
                "exportedName": "MyPortableFactory",
                "factoryId": 1
            }
        ]
    }
}
```

Note that the id that is passed to the `SerializationConfig` is same as the `factoryId` that `Foo` object returns.

## 4.3. Custom Serialization

Hazelcast lets you plug a custom serializer to be used for serialization of objects.

Let's say you have an object `Musician` and you would like to customize the serialization. The reason may be you want to use an external serializer for only one object.

```javascript
function Musician(name) {
    this.name = name;
}

Musician.prototype.hzGetCustomId = function () {
    return 10;
};
```

Let's say your custom `MusicianSerializer` will serialize `Musician`.

```javascript
function MusicianSerializer() {

}

MusicianSerializer.prototype.getId = function () {
    return 10;
}


MusicianSerializer.prototype.write = function (objectDataOutput, object) {
    objectDataOutput.writeInt(object.name.length);
    for (var i = 0; i < object.name.length; i++) {
        objectDataOutput.writeInt(object.name.charCodeAt(i));
    }
}

MusicianSerializer.prototype.read = function (objectDataInput) {
    var len = objectDataInput.readInt();
    var name = '';
    for (var i = 0; i < len; i++) {
        name = name + String.fromCharCode(objectDataInput.readInt());
    }
    return new Musician(name);
}
```

Note that the serializer `id` must be unique as Hazelcast will use it to lookup the `MusicianSerializer` while it deserializes the object. Now the last required step is to register the `MusicianSerializer` to the configuration.

**Programmatic Configuration:**

```javascript
var config = new Config.ClientConfig();
config.serializationConfig.customSerializers.push(new MusicianSerializer());
```

**Declarative Configuration:**

```json
{
    "serialization": {
        "defaultNumberType": "integer",
        "isBigEndian": false,
        "serializers": [
            {
                "path": "Musician.js",
                "exportedName": "MusicianSerializer",
                "typeId": 10
            }
        ]
    }
}
```

From now on, Hazelcast will use `MusicianSerializer` to serialize `Musician` objects.

## 4.4. Global Serialization

The global serializer is identical to custom serializers from the implementation perspective. The global serializer is registered as a fallback serializer to handle all other objects if a serializer cannot be located for them.

By default, JSON serialization is used if the object is not `IdentifiedDataSerializable` and `Portable` or there is no custom serializer for it. When you configure a global serializer, it is used instead of JSON serialization.

**Use cases**

- Third party serialization frameworks can be integrated using the global serializer.

- For your custom objects, you can implement a single serializer to handle all of them.

A sample global serializer that integrates with a third party serializer is shown below.

```javascript
function GlobalSerializer() {

}

GlobalSerializer.prototype.getId = function () {
    return 20;
};

GlobalSerializer.prototype.write = function (objectDataOutput, object) {
    objectDataOutput.write(SomeThirdPartySerializer.serialize(object))
};

GlobalSerializer.prototype.read = function (objectDataInput) {
    return SomeThirdPartySerializer.deserialize(objectDataInput);
};
```

You should register the global serializer in the configuration.

**Programmatic Configuration:**

```javascript
config.serializationConfig.globalSerializer = new GlobalSerializer();
```

**Declarative Configuration:**

```json
{
    "serialization": {
        "defaultNumberType": "integer",
        "isBigEndian": false,
        "globalSerializer": {
            "path": "SomeThirdPartySerializer.js",
            "exportedName": "SomeThirdPartySerializer"
        },
    }
}
```

# 5. Setting Up Client Network

All network related configuration of Hazelcast Node.js client is performed via the `network` element in the declarative configuration file, or in the object `ClientNetworkConfig` when using programmatic configuration. Let’s first give the examples for these two approaches. Then we will look at its sub-elements and attributes.

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

## 5.1. Providing the Member Addresses

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

## 5.2. Setting Smart Routing

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

## 5.3. Enabling Redo Operation

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

## 5.4. Setting Connection Timeout

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

## 5.5. Setting Connection Attempt Limit

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

## 5.6. Setting Connection Attempt Period

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

## 5.7. Enabling Client TLS/SSL

You can use TLS/SSL to secure the connection between the clients and members. If you want TLS/SSL enabled
for the client-cluster connection, you should set an SSL configuration. Please see [TLS/SSL section](#1-tlsssl).

As explained in the [TLS/SSL section](#1-tlsssl), Hazelcast members have key stores used to identify themselves (to other members) and Hazelcast Node.js clients have certificate authorities used to define which members they can trust. Hazelcast has the mutual authentication feature which allows the Node.js clients also to have their private keys and public certificates and members to have their certificate authorities so that the members can know which clients they can trust. Please see the [Mutual Authentication section](#13-mutual-authentication).

## 5.8. Enabling Hazelcast Cloud Discovery

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

# 6. Securing Client Connection

This chapter describes the security features of Hazelcast Node.js client. These include using TLS/SSL for connections between members and between clients and members and mutual authentication. These security features require **Hazelcast IMDG Enterprise** edition.

### 6.1. TLS/SSL

One of the offers of Hazelcast is the TLS/SSL protocol which you can use to establish an encrypted communication across your cluster with key stores and trust stores.

- A Java `keyStore` is a file that includes a private key and a public certificate. The equivalent of a key store is the combination of `key` and `cert` files at the Node.js client side.

- A Java `trustStore` is a file that includes a list of certificates trusted by your application which is named certificate authority. The equivalent of a trust store is a `ca` file at the Node.js client side.

You should set `keyStore` and `trustStore` before starting the members. See the next section how to set `keyStore` and `trustStore` on the server side.

#### 6.1.1. TLS/SSL for Hazelcast Members

Hazelcast allows you to encrypt socket level communication between Hazelcast members and between Hazelcast clients and members, for end to end encryption. To use it, see [TLS/SSL for Hazelcast Members section](http://docs.hazelcast.org/docs/latest/manual/html-single/index.html#tls-ssl-for-hazelcast-members).

#### 6.1.2. TLS/SSL for Hazelcast Node.js Clients

Hazelcast Node.js clients which support TLS/SSL should have the following user supplied SSL `options` object, to pass to
[`tls.connect` of Node.js](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback):

```javascript
var fs = require('fs');

var clientConfig = new Config.ClientConfig();
clientConfig.networkConfig.sslOptions = {
    rejectUnauthorized: true,
    ca: [fs.readFileSync(__dirname + '/server-cert.pem')],
    servername: 'foo.bar.com'
};
```

#### 6.1.3. Mutual Authentication

As explained above, Hazelcast members have key stores used to identify themselves (to other members) and Hazelcast clients have trust stores used to define which members they can trust.

Using mutual authentication, the clients also have their key stores and members have their trust stores so that the members can know which clients they can trust.

To enable mutual authentication, firstly, you need to set the following property at server side by configuring `hazelcast.xml`:

```xml
<network>
    <ssl enabled="true">
        <properties>
            <property name="javax.net.ssl.mutualAuthentication">REQUIRED</property>
        </properties>
    </ssl>
</network>
```

You can see the details of setting mutual authentication on the server side in the [Mutual Authentication section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#mutual-authentication) of the Reference Manual.

And at the Node.js client side, you need to supply SSL `options` object to pass to
[`tls.connect` of Node.js](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback).


There are two ways to provide this object to the client:

1. Using the built-in `BasicSSLOptionsFactory` bundled with the client.
2. Writing an SSLOptionsFactory.

Below subsections describe each way.

**Using Built-in BasicSSLOptionsFactory**

Hazelcast Node.js client includes a utility factory class that creates the necessary `options` object out of the supplied
properties. All you need to do is specifying your factory as `BasicSSLOptionsFactory` and provide the following options:

- caPath
- keyPath
- certPath
- servername
- rejectUnauthorized
- ciphers

Please refer to [`tls.connect` of Node.js](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback) for the descriptions of each option.

> `caPath`, `keyPath` and `certPath` define file path to respective file that stores such information.

```json
{
    "network": {
        "ssl": {
            "enabled": true,
            "factory": {
                "exportedName": "BasicSSLOptionsFactory",
                "properties": {
                    "caPath": "ca.pem",
                    "keyPath": "key.pem",
                    "certPath": "cert.pem",
                    "rejectUnauthorized": false
                }
            }
        }
    }
}
```

If these options are not enough for your application, you may write your own options factory and instruct the client
to get the options from it, as explained below.

**Writing an SSL Options Factory**

In order to use the full range of options provided to [`tls.connect` of Node.js](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback),
you may write your own factory object.

An example configuration:

```json
{
    "network": {
        "ssl": {
            "enabled": true,
            "factory": {
                "path": "my_factory.js",
                "exportedName": "SSLFactory",
                "properties": {
                    "caPath": "ca.pem",
                    "keyPath": "key.pem",
                    "certPath": "cert.pem",
                    "keepOrder": true
                }
            }
        }
    }
}
```


And your own factory, `My_Factory.js`:


```javascript
function SSLFactory() {
}

SSLFactory.prototype.init = function(props) {
    this.caPath = props.caPath;
    this.keyPath = props.keyPath;
    this.certPath = props.certPath;
    this.keepOrder = props.userDefinedProperty1;
};

SSLFactory.prototype.getSSLOptions = function() {
    var sslOpts = {
        servername: 'foo.bar.com',
        rejectUnauthorized: true,
        ca: fs.readFileSync(this.caPath)
        key: fs.readFileSync(this.keyPath),
        cert: fs.readFileSync(this.certPath),
    };
    if (this.keepOrder) {
        sslOpts.honorCipherOrder = true;
    }
    return sslOpts;
};
exports.SSLFactory = SSLFactory;
```

The client loads `MyFactory.js` at runtime and creates an instance of `SSLFactory`. It then calls the method `init` with
the properties section in the JSON configuration file. Lastly, the client calls the method `getSSLOptions` of `SSLFactory` to create the `options` object.

For information about the path resolution, please refer to the [Loading Objects and Path Resolution](#3-loading-objects-and-path-resolution) section.


# 7. Using Node.js Client with Hazelcast IMDG

## 7.1. Node.js Client API Overview

Most of the functions in the API return `Promise`. Therefore, you need to be familiar with the concept of promises to use the Node.js client. If not, you can learn about them using various online resources.

Promises provide a better way of working with callbacks. You can chain asynchronous functions by `then()` function of promise. Also, you can use `async/await`, if you use Node.js 8 and higher versions.

If you are ready to go, let's start to use Hazelcast Node.js client!

The first step is configuration. You can configure the Node.js client declaratively or programmatically. We will use the programmatic approach throughout this chapter. Please refer to the [Node.js Client Declarative Configuration section](#declarative-configuration) for details.

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.groupConfig.name = 'dev';
clientConfig.networkConfig.addresses.push('10.90.0.1', '10.90.0.2:5702');
```

The second step is initializing the `HazelcastClient` to be connected to the cluster.

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

## 7.2. Node.js Client Operation Modes

The client has two operation modes because of the distributed nature of the data and cluster.

### 7.2.1. Smart Client

In the smart mode, clients connect to each cluster member. Since each data partition uses the well known and consistent hashing algorithm, each client can send an operation to the relevant cluster member, which increases the overall throughput and efficiency. Smart mode is the default mode.


### 7.2.2. Unisocket Client

For some cases, the clients can be required to connect to a single member instead of each member in the cluster. Firewalls, security, or some custom networking issues can be the reason for these cases.

In the unisocket client mode, the client will only connect to one of the configured addresses. This single member will behave as a gateway to the other members. For any operation requested from the client, it will redirect the request to the relevant member and return the response back to the client returned from this member.

## 7.3. Handling Failures

There are two main failure cases you should be aware of, and configurations you can perform to achieve proper behavior.

### 7.3.1. Handling Client Connection Failure

While the client is trying to connect initially to one of the members in the `ClientNetworkConfig.addressList`, all the members might be not available. Instead of giving up, throwing an error and stopping the client, the client will retry as many as `connectionAttemptLimit` times. 

You can configure `connectionAttemptLimit` for the number of times you want the client to retry connecting. Please see [Setting Connection Attempt Limit](#5-setting-connection-attempt-limit).

The client executes each operation through the already established connection to the cluster. If this connection(s) disconnects or drops, the client will try to reconnect as configured.

### 7.3.2. Handling Retry-able Operation Failure

While sending the requests to related members, operations can fail due to various reasons. Read-only operations are retried by default. If you want to enable retry for the other operations, you can set the `redoOperation` to `true`. Please see [Enabling Redo Operation](#3-enabling-redo-operation).

You can set a timeout for retrying the operations sent to a member. This can be provided by using the property `hazelcast.client.invocation.timeout.seconds` in `ClientConfig.properties`. The client will retry an operation within this given period, of course, if it is a read-only operation or you enabled the `redoOperation` as stated in the above paragraph. This timeout value is important when there is a failure resulted by either of the following causes:

- Member throws an exception.

- Connection between the client and member is closed.

- Client’s heartbeat requests are timed out.

When a connection problem occurs, an operation is retried if it is certain that it has not run on the member yet or if it is idempotent such as a read-only operation, i.e., retrying does not have a side effect. If it is not certain whether the operation has run on the member, then the non-idempotent operations are not retried. However, as explained in the first paragraph of this section, you can force all client operations to be retried (`redoOperation`) when there is a connection failure between the client and member. But in this case, you should know that some operations may run multiple times causing conflicts. For example, assume that your client sent a `queue.offer` operation to the member, and then the connection is lost. Since there will be no response for this operation, you will not now whether it has run on the member or not. If you enabled `redoOperation`, it means this operation may run again, which may cause two instances of the same object in the queue.


## 7.4. Using Distributed Data Structures

Most of the Distributed Data Structures are supported by the Node.js client. In this chapter, you will learn how to use these distributed data structures.

### 7.4.1. Using Map

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

### 7.4.2. Using MultiMap

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

### 7.4.3. Using ReplicatedMap

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

### 7.4.4. Using Queue

A Queue usage example is shown below.

```javascript
var queue = client.getQueue('myQueue');

queue.offer('Furkan').then(function () {
    return queue.peek();
}).then(function (head) {
    console.log(head); // Furkan
});
```

## 7.5. Distributed Events


This chapter explains when various events are fired and describes how you can add event listeners on a Hazelcast Node.js client. These events can be categorized as cluster and distributed data structure events.

### 7.5.1. Cluster Events

You can add event listeners to a Hazelcast Node.js client. You can configure the following listeners to listen to the events on the client side.

`Membership Listener`: Notifies when a member joins to/leaves the cluster, or when an attribute is changed in a member.

`Distributed Object Listener`: Notifies when a distributed object is created or destroyed throughout the cluster.

`Lifecycle Listener`: Notifies when the client is starting, started, shutting down, and shutdown.

#### 7.5.1.1. Listening for Member Events

You can add the following types of member events to the `ClusterService`.

- `memberAdded`: A new member is added to the cluster.
- `memberRemoved`: An existing member leaves the cluster.
- `memberAttributeChanged`: An attribute of a member is changed. Please refer to [Defining Member Attributes](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#defining-member-attributes) section in the Hazelcast IMDG Reference Manual to learn about member attributes.

The `ClusterService` object exposes an `ClusterService.on()` function that allows one or more functions to be attached to member events emitted by the object.

The following is a membership listener registration by using `ClusterService.on()` function.

```javascript
client.clusterService.on('memberAdded', function (member) {
    console.log('Member Added: The address is', member.address.toString());
});
```

The `memberAttributeChanged` has its own type of event named `MemberAttributeEvent`. When there is an attribute change on the member, this event is fired.

Let’s take a look at the following example.

```javascript
client.clusterService.on('memberAttributeChanged', function (memberAttributeEvent) {
    console.log('Member Attribute Changed: The address is', memberAttributeEvent.member.address.toString());
});
```

#### 7.5.1.2. Listening for Distributed Object Events

The events for distributed objects are invoked when they are created and destroyed in the cluster. After the events, a listener callback function is called. The type of the callback function should be `DistributedObjectListener`. The parameter of the function is `DistributedObjectEvent` including following fields:

`serviceName`: Service name of the distributed object.

`objectName`: Name of the distributed object.

`eventType`: Type of the invoked event. It can be `created` or `destroyed`.

The following is an example of adding a Distributed Object Listener.

```javascript
client.addDistributedObjectListener(function (distributedObjectEvent) {
    console.log('Distributed object event >>> ',
        distributedObjectEvent.serviceName,
        distributedObjectEvent.objectName,
        distributedObjectEvent.eventType
    );
}).then(function () {
    var mapname = 'test';
    //this causes a created event
    client.getMap(mapname);
    //this causes no event because map was already created
    client.getMap(mapname);
});
```

#### 7.5.1.3. Listening for Lifecycle Events

The Lifecycle Listener notifies for the following events:
- `starting`: A client is starting.
- `started`: A client has started.
- `shuttingDown`: A client is shutting down.
- `shutdown`: A client’s shutdown has completed.

The following is an example of Lifecycle Listener that is added to config and its output.

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.listeners.addLifecycleListener(function (state) {
    console.log('Lifecycle Event >>> ' + state);
});

Client.newHazelcastClient(clientConfig).then(function (hazelcastClient) {
    hazelcastClient.shutdown();
});
```

**Output:**

```
Lifecycle Event >>> starting
[DefaultLogger] INFO at ConnectionAuthenticator: Connection to 10.216.1.62:5701 authenticated
[DefaultLogger] INFO at ClusterService: Members received.
[ Member {
    address: Address { host: '10.216.1.62', port: 5701, type: 4 },
    uuid: 'dc001432-7868-4ced-9161-5649ff6f31fc',
    isLiteMember: false,
    attributes: {} } ]
Lifecycle Event >>> started
[DefaultLogger] INFO at HazelcastClient: Client started
Lifecycle Event >>> shuttingDown
Lifecycle Event >>> shutdown

Process finished with exit code 0
```

### 7.5.2. Distributed Data Structure Events

You can add event listeners to the Distributed Data Structures.

> **NOTE: Hazelcast Node.js client is a TypeScript-based project but JavaScript does not have interfaces. Therefore, 
  some interfaces are given to user by using the TypeScript files that have `.ts` extension. In the documentation, implementing an interface means an object to have the necessary functions that are listed in the interface inside the `.ts` file. Also, this object is mentioned as `an instance of the interface`. You can search the [API Documentation](http://hazelcast.github.io/hazelcast-nodejs-client/api/current/docs/) or Github repository for a required interface.**

#### 7.5.2.1. Listening for Map Events

You can listen to map-wide or entry-based events by using the functions in the `MapListener` interface. Every function type in this interface is one of the `EntryEventListener` and `MapEventListener` types. To listen to these events, you need to implement the relevant `EntryEventListener` and `MapEventListener` functions in the `MapListener` interface. 

- An entry-based  event is fired after the operations that affect a specific entry. For example, `IMap.put()`, `IMap.remove()` or `IMap.evict()`. You should use the `EntryEventListener` type to listen these events. An `EntryEvent` object is passed to the listener function.

Let’s take a look at the following example.

```javascript
var entryEventListener = {
    added: function (entryEvent) {
        console.log('Entry Added:', entryEvent.key, entryEvent.value); // Entry Added: 1 Furkan
    }
};
map.addEntryListener(entryEventListener, undefined, true).then(function () {
    return map.put('1', 'Furkan');
});
```


- A map-wide event is fired as a result of a map-wide operation. For example, `IMap.clear()` or `IMap.evictAll()`. You should use the `MapEventListener` type to listen these events. A `MapEvent` object is passed to the listener function.

Let’s take a look at the following example.

```javascript
var mapEventListener = {
    mapCleared: function (mapEvent) {
        console.log('Map Cleared:', mapEvent.numberOfAffectedEntries); // Map Cleared: 3
    }
};
map.addEntryListener(mapEventListener).then(function () {
    return map.put('1', 'Mali');
}).then(function () {
    return map.put('2', 'Ahmet');
}).then(function () {
    return map.put('3', 'Furkan');
}).then(function () {
    return map.clear();
});
```

# 8. Development and Testing

Hazelcast Node.js client is developed using TypeScript. If you want to help with bug fixes, develop new features or
tweak the implementation to your application's needs, you can follow the steps in this section.

## 8.1. Building and Using Client From Sources

Follow the below steps to build and install Hazelcast Node.js client from its source:

1. Clone the GitHub repository (https://github.com/hazelcast/hazelcast-nodejs-client.git).
2. Run `npm install` to automatically download and install all required modules under `node_modules' directory.
3. Run  `npm run compile` to compile TypeScript files to JavaScript.

At this point you have all the runnable code(`.js`) and type declarations(`.d.ts`) in `lib` directory. You may create a link to this module so that your local
applications can depend on your local copy of Hazelcast Node.js client. In order to create a link, run:
- `npm link`.
This will create a global link to this module in your computer. Whenever you need to depend on this module from another
local project, run:
- `npm link hazelcast-client`

If you are planning to contribute, please run the style checker, as shown below, and fix the reported issues before sending a pull request.
- `npm run lint`

## 8.2. Testing
In order to test Hazelcast Node.js client locally, you will need the following:
* Java 6 or newer
* Maven

Following command starts the tests:

```
npm test
```

Test script automatically downloads `hazelcast-remote-controller` and Hazelcast IMDG. The script uses Maven to download those.

# 9. Getting Help

You can use the following channels for your questions and development/usage issues:

* This repository by opening an issue.
* Hazelcast Node.js client channel on Gitter: 
[![Join the chat at https://gitter.im/hazelcast-incubator/hazelcast-nodejs-client](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/hazelcast-incubator/hazelcast-nodejs-client?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
* Our Google Groups directory: https://groups.google.com/forum/#!forum/hazelcast
* Stack Overflow: https://stackoverflow.com/questions/tagged/hazelcast

# 10. Contributing

Besides your development contributions as explained in the [Development and Testing chapter](#8-development-and-testing) above, you can always open a pull request on this repository for your other requests such as documentation changes.

# 11. License

[Apache 2 License](https://github.com/hazelcast/hazelcast-nodejs-client/blob/master/LICENSE).

# 12. Copyright

Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.

Visit [www.hazelcast.com](http://www.hazelcast.com) for more information.
