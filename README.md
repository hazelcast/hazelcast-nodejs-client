[![Join the chat at https://gitter.im/hazelcast-incubator/hazelcast-nodejs-client](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/hazelcast-incubator/hazelcast-nodejs-client?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

# Table of Contents

* [Introduction](#introduction)
* [1. Getting Started](#1-getting-started)
  * [1.1. Requirements](#11-requirements)
  * [1.2. Working with Hazelcast IMDG Clusters](#12-working-with-hazelcast-imdg-clusters)
    * [1.2.1. Setting Up a Hazelcast IMDG Cluster](#121-setting-up-a-hazelcast-imdg-cluster)
      * [1.2.1.1. Using hazelcast-member Tool](#1211-using-hazelcast-member-tool)
        * [Installing on Mac OS X](#installing-on-mac-os-x)
        * [Installing on Ubuntu and Debian](#installing-on-ubuntu-and-debian)
        * [Installing on Red Hat and CentOS](#installing-on-red-hat-and-centos)
      * [1.2.1.2. Running Standalone JARs](#1212-running-standalone-jars)
      * [1.2.1.3. Adding User Library to CLASSPATH](#1213-adding-user-library-to-classpath)
  * [1.3. Downloading and Installing](#13-downloading-and-installing)
  * [1.4. Basic Configuration](#14-basic-configuration)
    * [1.4.1. Configuring Hazelcast IMDG](#141-configuring-hazelcast-imdg)
    * [1.4.2. Configuring Hazelcast Node.js Client](#142-configuring-hazelcast-nodejs-client)
      * [1.4.2.1. Group Settings](#1421-group-settings)
      * [1.4.2.2. Network Settings](#1422-network-settings)
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
  * [5.1. Providing Member Addresses](#51-providing-member-addresses)
  * [5.2. Setting Smart Routing](#52-setting-smart-routing)
  * [5.3. Enabling Redo Operation](#53-enabling-redo-operation)
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
    * [7.4.3. Using Replicated Map](#743-using-replicated-map)
    * [7.4.4. Using Queue](#744-using-queue)
    * [7.4.5. Using Set](#745-using-set)
    * [7.4.6. Using List](#746-using-list)
    * [7.4.7. Using Ringbuffer](#747-using-ringbuffer)
    * [7.4.8. Using Reliable Topic](#748-using-reliable-topic)
    * [7.4.9. Using Lock](#749-using-lock)
    * [7.4.10. Using Atomic Long](#7410-using-atomic-long)
    * [7.4.11. Using Semaphore](#7411-using-semaphore)
    * [7.4.12. Using PN Counter](#7412-using-pn-counter)
    * [7.4.13. Using Flake ID Generator](#7413-using-flake-id-generator)
  * [7.5. Distributed Events](#75-distributed-events)
    * [7.5.1. Listening for Cluster Events](#751-listening-for-cluster-events)
      * [7.5.1.1. Membership Listener](#7511-membership-listener)
      * [7.5.1.2. Distributed Object Listener](#7512-distributed-object-listener)
      * [7.5.1.3. Lifecycle Listener](#7513-lifecycle-listener)
    * [7.5.2. Listening for Distributed Data Structure Events](#752-listening-for-distributed-data-structure-events)
      * [7.5.2.1. Map Listener](#7521-map-listener)
      * [7.5.2.2. Entry Listener](#7522-entry-listener)
      * [7.5.2.3. Item Listener](#7523-item-listener)
      * [7.5.2.4. Message Listener](#7524-message-listener)
  * [7.6. Distributed Computing](#76-distributed-computing)
    * [7.6.1. Using EntryProcessor](#761-using-entryprocessor)
     * [Processing Entries](#processing-entries)
  * [7.7. Distributed Query](#77-distributed-query)
    * [7.7.1. How Distributed Query Works](#771-how-distributed-query-works)
      * [7.7.1.1. Employee Map Query Example](#7711-employee-map-query-example)
      * [7.7.1.2. Querying by Combining Predicates with AND, OR, NOT](#7712-querying-by-combining-predicates-with-and-or-not)
      * [7.7.1.3. Querying with SQL](#7713-querying-with-sql)
         * [Supported SQL Syntax](#supported-sql-syntax)
         * [Querying Examples with Predicates](#querying-examples-with-predicates)
      * [7.7.1.4. Filtering with Paging Predicates](#7714-filtering-with-paging-predicates)
    * [7.7.2. Fast-Aggregations](#772-fast-aggregations)
  * [7.8. Performance](#78-performance)
    * [7.8.1. Partition Aware](#781-partition-aware)
    * [7.8.2. Near Cache](#782-near-cache)
      * [7.8.2.1. Configuring Near Cache](#7821-configuring-near-cache)
      * [7.8.2.2. Near Cache Example for Map](#7822-near-cache-example-for-map)
      * [7.8.2.3. Near Cache Eviction](#7823-near-cache-eviction)
      * [7.8.2.4. Near Cache Expiration](#7824-near-cache-expiration)
      * [7.8.2.5. Near Cache Invalidation](#7825-near-cache-invalidation)
      * [7.8.2.6. Near Cache Eventual Consistency](#7826-near-cache-eventual-consistency)
  * [7.9. Monitoring and Logging](#79-monitoring-and-logging)
    * [7.9.1. Enabling Client Statistics](#791-enabling-client-statistics)
    * [7.9.2. Logging Configuration](#792-logging-configuration)
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

See the [Releases](https://github.com/hazelcast/hazelcast-nodejs-client/releases) page of this repository.


# 1. Getting Started

This chapter provides information on how to get started with your Hazelcast Node.js client. It outlines the requirements, installation and configuration of the client, setting up a cluster, and provides a simple application that uses a distributed map in Node.js client.

## 1.1. Requirements

- Windows, Linux or MacOS
- Node.js 4 or newer
- Java 6 or newer
- Hazelcast IMDG 3.6 or newer
- Latest Hazelcast Node.js client

## 1.2. Working with Hazelcast IMDG Clusters

Hazelcast Node.js client requires a working Hazelcast IMDG cluster to run. This cluster handles storage and manipulation of the user data.
Clients are a way to connect to the Hazelcast IMDG cluster and access such data.

Hazelcast IMDG cluster consists of one or more cluster members. These members generally run on multiple virtual or physical machines
and are connected to each other via network. Any data put on the cluster is partitioned to multiple members transparent to the user.
It is therefore very easy to scale the system by adding new members as the data grows. Hazelcast IMDG cluster also offers resilience. Should
any hardware or software problem causes a crash to any member, the data on that member is recovered from backups and the cluster
continues to operate without any downtime. Hazelcast clients are an easy way to connect to a Hazelcast IMDG cluster and perform tasks on
distributed data structures that live on the cluster.

In order to use Hazelcast Node.js client, we first need to setup a Hazelcast IMDG cluster.

### 1.2.1. Setting Up a Hazelcast IMDG Cluster

There are following options to start a Hazelcast IMDG cluster easily:

* You can run standalone members by downloading and running JAR files from the website.
* You can embed members to your Java projects.
* The easiest way is to use [hazelcast-member tool](https://github.com/hazelcast/hazelcast-member-tool) if you have brew installed in your computer.

We are going to download JARs from the website and run a standalone member for this guide.

#### 1.2.1.1. Using hazelcast-member Tool

`hazelcast-member` is a tool to download and run Hazelcast IMDG members easily. You can find the installation instructions for various platforms in the following sections.

##### Installing on Mac OS X

If you have brew installed, run the following commands to install this tool:

```
brew tap hazelcast/homebrew-hazelcast
brew install hazelcast-member
```

##### Installing on Ubuntu and Debian

To resolve the `.deb` artifacts from Bintray, follow the below instructions.

First, you need to import the Bintray's GPG key using the following command:

```
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 379CE192D401AB61
```

Then, run the following commands to add the `.deb` artifact to your system configuration file and update the lists of packages:

```
echo "deb https://dl.bintray.com/hazelcast/deb stable main" | sudo tee -a /etc/apt/sources.list
sudo apt-get update
```

Finally, run the following command to install the `hazelcast-member` tool:

```
sudo apt-get install hazelcast-member
```

##### Installing on Red Hat and CentOS

To resolve the `RPM` artifacts from Bintray, follow the below instructions.

First, run the following command to get a generated `.repo` file:

```
wget https://bintray.com/hazelcast/rpm/rpm -O bintray-hazelcast-rpm.repo
```

Then, install the `.repo` file using the following command:


```
sudo mv bintray-hazelcast-rpm.repo /etc/yum.repos.d/
```

Finally, run the following command to install the `hazelcast-member` tool:

```
sudo yum install hazelcast-member
```

---

After successfully installing the `hazelcast-member` tool, you can start a member by running the following command:

```
hazelcast-member start
```

To stop a member, run the following command:

```
hazelcast-member stop
```

You can find more information about the `hazelcast-member` tool at its GitHub [repo](https://github.com/hazelcast/hazelcast-member-tool).

See the [Hazelcast IMDG Reference Manual](http://docs.hazelcast.org/docs/latest/manual/html-single/index.html#getting-started) for more information on setting up the clusters.


#### 1.2.1.2. Running Standalone JARs

Follow the instructions below to create a Hazelcast IMDG cluster:

1. Go to Hazelcast's download [page](https://hazelcast.org/download/) and download either the `.zip` or `.tar` distribution of Hazelcast IMDG.
2. Decompress the contents into any directory that you
want to run members from.
3. Change into the directory that you decompressed the Hazelcast content and then into the `bin` directory.
4. Use either `start.sh` or `start.bat` depending on your operating system. Once you run the start script, you should see the Hazelcast IMDG logs in the terminal.

You should see a log similar to the following, which means that your 1-member cluster is ready to be used:

```
INFO: [192.168.0.3]:5701 [dev] [3.10.4]

Members {size:1, ver:1} [
	Member [192.168.0.3]:5701 - 65dac4d1-2559-44bb-ba2e-ca41c56eedd6 this
]

Sep 06, 2018 10:50:23 AM com.hazelcast.core.LifecycleService
INFO: [192.168.0.3]:5701 [dev] [3.10.4] [192.168.0.3]:5701 is STARTED
```

#### 1.2.1.3. Adding User Library to CLASSPATH

When you want to use features such as querying and language interoperability, you might need to add your own Java classes to the Hazelcast member in order to use them from your Node.js client. This can be done by adding your own compiled code to the `CLASSPATH`. To do this, compile your code with the `CLASSPATH` and add the compiled files to the `user-lib` directory in the extracted `hazelcast-<version>.zip` (or `tar`). Then, you can start your Hazelcast member by using the start scripts in the `bin` directory. The start scripts will automatically add your compiled classes to the `CLASSPATH`.

Note that if you are adding an `IdentifiedDataSerializable` or a `Portable` class, you need to add its factory too. Then, you should configure the factory in the `hazelcast.xml` configuration file. This file resides in the `bin` directory where you extracted the `hazelcast-<version>.zip` (or `tar`).

The following is an example configuration when you are adding an `IdentifiedDataSerializable` class:

```xml
<hazelcast>
     ...
     <serialization>
        <data-serializable-factories>
            <data-serializable-factory factory-id=<identified-factory-id>>
                IdentifiedFactoryClassName
            </data-serializable-factory>
        </data-serializable-factories>
    </serialization>
    ...
</hazelcast>
```
If you want to add a `Portable` class, you should use `<portable-factories>` instead of `<data-serializable-factories>` in the above configuration.

## 1.3. Downloading and Installing

Hazelcast Node.js client is on NPM. Just add `hazelcast-client` as a dependency to your Node.js project and you are good to go.

```
npm install hazelcast-client --save
```

## 1.4. Basic Configuration

If you are using Hazelcast IMDG and Node.js Client on the same computer, generally the default configuration should be fine. This is great for
trying out the client. However, if you run the client on a different computer than any of the cluster members, you may
need to do some simple configurations such as specifying the member addresses.

The Hazelcast IMDG members and clients have their own configuration options. You may need to reflect some of the member side configurations on the client side to properly connect to the cluster.

This section describes the most common configuration elements to get you started in no time.
It discusses some member side configuration options to ease the understanding of Hazelcast's ecosystem. Then, the client side configuration options
regarding the cluster connection are discussed. The configurations for the Hazelcast IMDG data structures that can be used in the Node.js client are discussed in the following sections.

See the [Hazelcast IMDG Reference Manual](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html) and [Configuration Overview section](#3-configuration-overview) for more information.

### 1.4.1. Configuring Hazelcast IMDG

Hazelcast IMDG aims to run out-of-the-box for most common scenarios. However if you have limitations on your network such as multicast being disabled,
you may have to configure your Hazelcast IMDG members so that they can find each other on the network. Also, since most of the distributed data structures are configurable, you may want to configure them according to your needs. We will show you the basics about network configuration here.

You can use the following options to configure Hazelcast IMDG:

* Using the `hazelcast.xml` configuration file.
* Programmatically configuring the member before starting it from the Java code.

Since we use standalone servers, we will use the `hazelcast.xml` file to configure our cluster members.

When you download and unzip `hazelcast-<version>.zip` (or `tar`), you see the `hazelcast.xml` in the `bin` directory. When a Hazelcast member starts, it looks for the `hazelcast.xml` file to load the configuration from. A sample `hazelcast.xml` is shown below.

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

We will go over some important configuration elements in the rest of this section.

- `<group>`: Specifies which cluster this member belongs to. A member connects only to the other members that are in the same group as
itself. As shown in the above configuration sample, there are `<name>` and `<password>` tags under the `<group>` element with some pre-configured values. You may give your clusters different names so that they can
live in the same network without disturbing each other. Note that the cluster name should be the same across all members and clients that belong
 to the same cluster. The `<password>` tag is not in use since Hazelcast 3.9. It is there for backward compatibility
purposes. You can remove or leave it as it is if you use Hazelcast 3.9 or later.
- `<network>`
    - `<port>`: Specifies the port number to be used by the member when it starts. Its default value is 5701. You can specify another port number, and if
     you set `auto-increment` to `true`, then Hazelcast will try the subsequent ports until it finds an available port or the `port-count` is reached.
    - `<join>`: Specifies the strategies to be used by the member to find other cluster members. Choose which strategy you want to
    use by setting its `enabled` attribute to `true` and the others to `false`.
        - `<multicast>`: Members find each other by sending multicast requests to the specified address and port. It is very useful if IP addresses
        of the members are not static.
        - `<tcp>`: This strategy uses a pre-configured list of known members to find an already existing cluster. It is enough for a member to
        find only one cluster member to connect to the cluster. The rest of the member list is automatically retrieved from that member. We recommend
        putting multiple known member addresses there to avoid disconnectivity should one of the members in the list is unavailable at the time
        of connection.

These configuration elements are enough for most connection scenarios. Now we will move onto the configuration of the Node.js client.

### 1.4.2. Configuring Hazelcast Node.js Client

There are two ways to configure a Hazelcast Node.js client:

* Programmatically
* Declaratively (JSON)

This section describes some network configuration settings to cover common use cases in connecting the client to a cluster. See the [Configuration Overview section](#3-configuration-overview)
and the following sections for information about detailed network configurations and/or additional features of Hazelcast Node.js client configuration.

An easy way to configure your Hazelcast Node.js client is to create a `ClientConfig` object and set the appropriate options. Then you can
supply this object to your client at the startup. This is the programmatic configuration approach. Another way to configure your client, which is the declarative approach, is to provide a `hazelcast-client.json` file. This is similar to the `hazelcast.xml` approach
in configuring the member. Note that `hazelcast-client.json` is a JSON file whereas the member configuration is XML based. Although these
two formats are different, you will realize that the names of configuration parameters are the same for both the client and member.
It is done this way to make it easier to transfer Hazelcast skills to multiple platforms.

Once you embedded `hazelcast-client` to your Node.js project, you may follow any of programmatic or declarative configuration approaches.
We will provide both ways for each configuration option in this section. Pick one way and stick to it.

**Programmatic Configuration:**

You need to create a `ClientConfig` object and adjust its properties. Then you can pass this object to the client when starting it.

```javascript
let Client = require('hazelcast-client').Client;
let Config = require('hazelcast-client').Config;
let config = new Config.ClientConfig();
Client.newHazelcastClient(config).then(function(client) {
    // some operations
});
```

**Declarative Configuration:**

Hazelcast Node.js client looks for a `hazelcast-client.json` in the current working directory unless you provide a configuration object
at the startup. If you intend to configure your client using a configuration file, then place a `hazelcast-client.json` in the directory
of your application's entry point.

If you prefer to keep your `hazelcast-client.json` file somewhere else, you can override the environment variable `HAZELCAST_CLIENT_CONFIG`
with the location of your config file. In this case, the client uses the configuration file specified in the environment variable.

For the structure of `hazelcast-client.json`, see the [hazelcast-client-full.json file](hazelcast-client-full.json). You
can use only the relevant parts of the file in your `hazelcast-client.json` and remove the rest. The default configuration is used for any
part that you do not explicitly set in the `hazelcast-client.json` file.

---

If you run the Hazelcast IMDG members in a different server than the client, you most probably have configured the members' ports and cluster
names as explained in the previous section. If you did, then you need to make certain changes to the network settings of your client.

#### 1.4.2.1. Group Settings

You need to provide the group name of the cluster, if it is defined on the server side, to which you want the client to connect.

**Programmatic Configuration:**

```javascript
let cfg = new Config.ClientConfig();
cfg.group.name = 'group name of your cluster'
```

**Declarative Configuration:**

```json
{
    "group": {
        "name": "group name of your cluster"
    }
}
```

> **NOTE: If you have a Hazelcast IMDG release older than 3.11, you need to provide also a group password along with the group name.**

#### 1.4.2.2. Network Settings

You need to provide the IP address and port of at least one member in your cluster so the client can find it.

**Programmatic Configuration:**

```javascript
let cfg = new Config.ClientConfig();
cfg.network.addresses.push('some-ip-address:port');
```

**Declarative Configuration:**

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
distributed map in the Node.js client.

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

This should print logs about the cluster members and information about the client itself such as the client type, UUID and address.

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

Congratulations! You just started a Hazelcast Node.js client.

**Using a Map**

Let's manipulate a distributed map on a cluster using the client.

Save the following file as `IT.js` and run it using `node IT.js`.

**IT.js**
```javascript
let Client = require('hazelcast-client').Client;
let Config = require('hazelcast-client').Config;
let config = new Config.ClientConfig();

Client.newHazelcastClient(config).then(function (client) {
    var personnelMap;
    return client.getMap('personnelMap').then(function (mp) {
        personnelMap = mp;
        return personnelMap.put('Alice', 'IT');
    }).then(function () {
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

You see this example puts all the IT personnel into a cluster-wide `personnelMap` and then prints all the known personnel.

Now create a `Sales.js` file as shown below and run it using `node Sales.js`.

**Sales.js**

```javascript
let Client = require('hazelcast-client').Client;
let Config = require('hazelcast-client').Config;
let config = new Config.ClientConfig();

Client.newHazelcastClient(config).then(function (client) {
    var personnelMap;
    return client.getMap('personnelMap').then(function (mp) {
        personnelMap = mp;
        return personnelMap.put('Denise', 'Sales');
    }).then(function () {
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

See the Hazelcast Node.js [code samples](https://github.com/hazelcast/hazelcast-nodejs-client/tree/master/code_samples) for more examples.

You can also see the Hazelcast Node.js [API Documentation](http://hazelcast.github.io/hazelcast-nodejs-client/api/current/docs/).

# 2. Features

Hazelcast Node.js client supports the following data structures and features:

* Map
* Queue
* Set
* List
* MultiMap
* Replicated Map
* Ringbuffer
* Reliable Topic
* Lock
* Semaphore
* Atomic Long
* CRDT PN Counter
* Flake Id Generator
* Event Listeners
* Entry Processor
* Query (Predicates)
* Paging Predicate
* Built-in Predicates
* Listener with Predicate
* Fast Aggregations
* Near Cache Support
* Eventual Consistency Control
* Declarative Configuration (JSON)
* Programmatic Configuration
* Client Configuration Import
* Fail Fast on Invalid Configuration
* SSL Support (requires Enterprise server)
* Mutual Authentication (requires Enterprise server)
* Authorization
* Smart Client
* Unisocket Client
* Lifecycle Service
* Hazelcast Cloud Discovery
* IdentifiedDataSerializable Serialization
* Portable Serialization
* Custom Serialization
* Global Serialization

# 3. Configuration Overview

This chapter describes the options to configure your Node.js client and explains how you can import multiple configurations
and how you should set paths and exported names for the client to load objects.

## 3.1. Configuration Options

You can configure the Hazelcast Node.js client declaratively (JSON) or programmatically (API).

### 3.1.1. Programmatic Configuration

For programmatic configuration of the Hazelcast Node.js client, just instantiate a `ClientConfig` object and configure the
desired aspects. An example is shown below.

```javascript
var Config = require('hazelcast-client').Config;
var cfg = new Config.ClientConfig();
cfg.networkConfig.addresses.push('127.0.0.1:5701');
HazelcastClient.newHazelcastClient(cfg).then(function (client) {
    // some operations
});
```

See the `ClientConfig` class documentation at [Hazelcast Node.js Client API Docs](http://hazelcast.github.io/hazelcast-nodejs-client/api/current/docs) for details.

### 3.1.2. Declarative Configuration (JSON)

If the client is not supplied with a programmatic configuration at the time of initialization, it will look for a configuration file named `hazelcast-client.json`. If this file exists, then the configuration is loaded from it. Otherwise, the client will start with the default configuration. The following are the places that the client looks for a `hazelcast-client.json` in the given order:

1. Environment variable: The client first looks for the environment variable `HAZELCAST_CLIENT_CONFIG`. If it exists,
the client looks for the configuration file in the specified location.
2. Current working directory: If there is no environment variable set, the client tries to load `hazelcast-client.json`
from the current working directory.
3. Default configuration: If all of the above methods fail, the client starts with the default configuration.
The default configuration is programmatic. If you want to override the default configuration declaratively, you need to create
a `hazelcast-client.json` file in your working directory. If you want to have an example for this file, you can find `hazelcast-client-default.json` and `hazelcast-client-sample.json` files in the GitHub repository.

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

In the `factory_utils.js` file, you have multiple exported functions:

```javascript
exports.utilityFunction = function() {...}
exports.MySSLFactory = function() {...}
```

In order to load `MySSLFactory` in your SSL configuration, you should set `path` and `exportedName` as `factory_utils.js`
and `MySSLFactory`, respectively.

If you have only one export as the default export from `factory_utils.js`, just skip the `exportedName` property and
the client will load the default export from the file.


# 4. Serialization

Serialization is the process of converting an object into a stream of bytes to store the object in the memory, a file or database, or transmit it through the network. Its main purpose is to save the state of an object in order to be able to recreate it when needed. The reverse process is called deserialization. Hazelcast offers you its own native serialization methods. You will see these methods throughout this chapter.

Hazelcast serializes all your objects before sending them to the server. The `boolean`, `number`,`string` and `Long` types are serialized natively and you cannot override this behavior. The following table is the conversion of types for the Java server side.

| Node.js | Java                                |
|---------|-------------------------------------|
| boolean | Boolean                             |
| number  | Byte, Short, Integer, Float, Double |
| string  | String                              |
| Long    | Long                                |

> Note: A `number` type is serialized as `Double` by default. You can configure this behavior using the `SerializationConfig.defaultNumberType` method.

Arrays of the above types can be serialized as `boolean[]`, `byte[]`, `short[]`, `int[]`, `float[]`, `double[]`, `long[]` and `string[]` for the Java server side, respectively.

**Serialization Priority**

When Hazelcast Node.js client serializes an object:

1. It first checks whether the object is null.

2. If the above check fails, then it checks if it is an instance of `IdentifiedDataSerializable`.

3. If the above check fails, then it checks if it is an instance of `Portable`.

4. If the above check fails, then it checks if it is an instance of one of the default types (see above default types).

5. If the above check fails, then it looks for a user-specified [Custom Serialization](#43-custom-serialization).

6. If the above check fails, it will use the registered [Global Serialization](#44-global-serialization) if one exists.

7. If the above check fails, then the Node.js client uses `JSON Serialization` by default.

However, `JSON Serialization` is not the best way of serialization in terms of performance and interoperability between the clients in different languages. If you want the serialization to work faster or you use the clients in different languages, Hazelcast offers its own native serialization methods, such as [`IdentifiedDataSerializable` Serialization](#41-identifieddataserializable-serialization) and [`Portable` Serialization](#42-portable-serialization).

Or, if you want to use your own serialization method, you can use a [Custom Serialization](#43-custom-serialization).

> **NOTE: Hazelcast Node.js client is a TypeScript-based project but JavaScript does not have interfaces. Therefore,
 some interfaces are given to the user by using the TypeScript files that have `.ts` extension. In this guide, implementing an interface means creating an object to have the necessary functions that are listed in the interface inside the `.ts` file. Also, this object is mentioned as `an instance of the interface`. You can search the [API Documentation](http://hazelcast.github.io/hazelcast-nodejs-client/api/current/docs/) or GitHub repository for a required interface.**

## 4.1. IdentifiedDataSerializable Serialization

For a faster serialization of objects, Hazelcast recommends to implement the `IdentifiedDataSerializable` interface. The following is an example of an object implementing this interface:

```javascript
function Employee(id, name) {
    this.id = id;
    this.name = name;
}

Employee.prototype.readData = function (input) {
    this.id = input.readInt();
    this.name = input.readUTF();
};

Employee.prototype.writeData = function (output) {
    output.writeInt(this.id);
    output.writeUTF(this.name);
};

Employee.prototype.getFactoryId = function () {
    return 1000;
};

Employee.prototype.getClassId = function () {
    return 100;
};

Employee.prototype.getClassId = function () {
    return this.classId;
};
```

The `IdentifiedDataSerializable` interface uses `getClassId()` and `getFactoryId()` to reconstitute the object. To complete the implementation, `IdentifiedDataSerializableFactory` should also be implemented and registered into `SerializationConfig` which can be accessed from `Config.serializationConfig`. The factory's responsibility is to return an instance of the right `IdentifiedDataSerializable` object, given the `classId`.

A sample `IdentifiedDataSerializableFactory` could be implemented as follows:

```javascript
function SampleDataSerializableFactory() {
    // Constructor function
}

SampleDataSerializableFactory.prototype.create = function (type) {
    if (type === 100) {
        return new Employee();
    }
    return null;
};
```

The last step is to register the `IdentifiedDataSerializableFactory` to the `SerializationConfig`.

**Programmatic Configuration:**

```javascript
var config = new Config.ClientConfig();
config.serializationConfig.dataSerializableFactories[1000] = new SampleDataSerializableFactory();
```

**Declarative Configuration:**

```json
{
    "serialization": {
        "dataSerializableFactories": [
            {
                "path": "factory.js",
                "exportedName": "SampleDataSerializableFactory",
                "factoryId": 1000
            }
        ]
    }
}
```

Note that the ID that is passed to the `SerializationConfig` is same as the `factoryId` that the `Employee` object returns.

## 4.2. Portable Serialization

As an alternative to the existing serialization methods, Hazelcast offers portable serialization. To use it, you need to implement the `Portable` interface. Portable serialization has the following advantages:

- Supporting multiversion of the same object type.
- Fetching individual fields without having to rely on the reflection.
- Querying and indexing support without deserialization and/or reflection.

In order to support these features, a serialized `Portable` object contains meta information like the version and concrete location of the each field in the binary data. This way Hazelcast is able to navigate in the binary data and deserialize only the required field without actually deserializing the whole object which improves the query performance.

With multiversion support, you can have two members where each of them having different versions of the same object, and Hazelcast will store both meta information and use the correct one to serialize and deserialize portable objects depending on the member. This is very helpful when you are doing a rolling upgrade without shutting down the cluster.

Also note that portable serialization is totally language independent and is used as the binary protocol between Hazelcast server and clients.

A sample portable implementation of a `Customer` class looks like the following:

```javascript
function Customer(name, id, lastOrder) {
    this.name = name;
    this.id = id;
    this.lastOrder = lastOrder;
    this.classId = 1;
}

Customer.prototype.readPortable = function (reader) {
    this.name = reader.readUTF('name');
    this.id = reader.readInt('id');
    this.lastOrder = reader.readLong('lastOrder').toNumber();
};

Customer.prototype.writePortable = function (writer) {
    writer.writeUTF('name', this.name);
    writer.writeInt('id', this.id);
    writer.writeLong('lastOrder', Long.fromNumber(this.lastOrder));
};

Customer.prototype.getFactoryId = function () {
    return PortableFactory.factoryId;
};

Customer.prototype.getClassId = function () {
    return this.classId;
};
```

Similar to `IdentifiedDataSerializable`, a `Portable` object must provide `classId` and `factoryId`. The factory object will be used to create the `Portable` object given the `classId`.

A sample `PortableFactory` could be implemented as follows:

```javascript
function PortableFactory() {
    // Constructor function
}

PortableFactory.prototype.create = function (classId) {
    if (classId === 1) {
        return new Customer();
    }
    return null;
};
```

The last step is to register the `PortableFactory` to the `SerializationConfig`.

**Programmatic Configuration:**

```javascript
var config = new Config.ClientConfig();
config.serializationConfig.portableFactories[1] = new PortableFactory();
```

**Declarative Configuration:**

```json
{
    "serialization": {
        "portableFactories": [
            {
                "path": "factory.js",
                "exportedName": "PortableFactory",
                "factoryId": 1
            }
        ]
    }
}
```

Note that the ID that is passed to the `SerializationConfig` is same as the `factoryId` that `Customer` object returns.

## 4.3. Custom Serialization

Hazelcast lets you plug a custom serializer to be used for serialization of objects.

Let's say you have an object `CustomSerializable` and you would like to customize the serialization, since you may want to use an external serializer for only one object.

```javascript
function CustomSerializable(value) {
    this.value = value;
}

CustomSerializable.prototype.hzGetCustomId = function () {
    return 10;
};
```

Let's say your custom `CustomSerializer` will serialize `CustomSerializable`.

```javascript
function CustomSerializer() {
    // Constructor function
}

CustomSerializer.prototype.getId = function () {
    return 10;
};

CustomSerializer.prototype.write = function (output, t) {
    output.writeInt(t.value.length);
    for (var i = 0; i < t.value.length; i++) {
        output.writeInt(t.value.charCodeAt(i));
    }
};

CustomSerializer.prototype.read = function (reader) {
    var len = reader.readInt();
    var str = '';
    for (var i = 0; i < len; i++) {
        str = str + String.fromCharCode(reader.readInt());
    }
    return new CustomSerializable(str);
};
```

Note that the serializer `id` must be unique as Hazelcast will use it to lookup the `CustomSerializer` while it deserializes the object. Now the last required step is to register the `CustomSerializer` to the configuration.

**Programmatic Configuration:**

```javascript
var config = new Config.ClientConfig();
config.serializationConfig.customSerializers.push(new CustomSerializer());
```

**Declarative Configuration:**

```json
{
    "serialization": {
        "defaultNumberType": "integer",
        "isBigEndian": false,
        "serializers": [
            {
                "path": "custom.js",
                "exportedName": "CustomSerializer",
                "typeId": 10
            }
        ]
    }
}
```

From now on, Hazelcast will use `CustomSerializer` to serialize `CustomSerializable` objects.

## 4.4. Global Serialization

The global serializer is identical to custom serializers from the implementation perspective. The global serializer is registered as a fallback serializer to handle all other objects if a serializer cannot be located for them.

By default, JSON serialization is used if the object is not `IdentifiedDataSerializable` or `Portable` or there is no custom serializer for it. When you configure a global serializer, it is used instead of JSON serialization.

**Use cases:**

* Third party serialization frameworks can be integrated using the global serializer.
* For your custom objects, you can implement a single serializer to handle all of them.

A sample global serializer that integrates with a third party serializer is shown below.

```javascript
function GlobalSerializer() {
    // Constructor function
}

GlobalSerializer.prototype.getId = function () {
    return 20;
};

GlobalSerializer.prototype.read = function (input) {
    return MyFavoriteSerializer.deserialize(input.readByteArray());
};

GlobalSerializer.prototype.write = function (output, obj) {
    output.writeByteArray(MyFavoriteSerializer.serialize(obj))
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
            "path": "global_serializer.js",
            "exportedName": "MyFavoriteSerializer"
        },
    }
}
```

# 5. Setting Up Client Network

All network related configuration of Hazelcast Node.js client is performed via the `network` element in the declarative configuration file, or in the object `ClientNetworkConfig` when using programmatic configuration. Let's first give the examples for these two approaches. Then we will look at its sub-elements and attributes.

**Declarative Configuration:**

Here is an example of configuring the network for Node.js Client declaratively.

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

**Programmatic Configuration:**

Here is an example of configuring the network for Node.js Client programmatically.

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.networkConfig.addresses.push('10.1.1.21', '10.1.1.22:5703');
clientConfig.networkConfig.smartRouting = true;
clientConfig.networkConfig.redoOperation = true;
clientConfig.networkConfig.connectionTimeout = 6000;
clientConfig.networkConfig.connectionAttemptPeriod = 5000;
clientConfig.networkConfig.connectionAttemptLimit = 5;
```

## 5.1. Providing Member Addresses

Address list is the initial list of cluster addresses which the client will connect to. The client uses this
list to find an alive member. Although it may be enough to give only one address of a member in the cluster
(since all members communicate with each other), it is recommended that you give the addresses for all the members.

**Declarative Configuration:**

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

**Programmatic Configuration:**

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.networkConfig.addresses.push('10.1.1.21', '10.1.1.22:5703');
```

If the port part is omitted, then 5701, 5702 and 5703 will be tried in a random order.

You can specify multiple addresses with or without the port information as seen above. The provided list is shuffled and tried in a random order. Its default value is `localhost`.

## 5.2. Setting Smart Routing

Smart routing defines whether the client mode is smart or unisocket. See the [Node.js Client Operation Modes section](#72-nodejs-client-operation-modes)
for the description of smart and unisocket modes.

The following are example configurations.

**Declarative Configuration:**

```json
{
    "network": {
        "smartRouting": true
    }
}
```

**Programmatic Configuration:**

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.networkConfig.smartRouting = true;
```

Its default value is `true` (smart client mode).

## 5.3. Enabling Redo Operation

It enables/disables redo-able operations. While sending the requests to the related members, the operations can fail due to various reasons. Read-only operations are retried by default. If you want to enable retry for the other operations, you can set the `redoOperation` to `true`.

**Declarative Configuration:**

```json
{
    "network": {
        "redoOperation": true
    }
}
```

**Programmatic Configuration:**

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.networkConfig.redoOperation = true;
```

Its default value is `false` (disabled).

## 5.4. Setting Connection Timeout

Connection timeout is the timeout value in milliseconds for the members to accept the client connection requests.
If the member does not respond within the timeout, the client will retry to connect as many as `ClientNetworkConfig.connectionAttemptLimit` times.

The following are the example configurations.


**Declarative Configuration:**

```json
{
    "network": {
        "connectionTimeout": 6000
    }
}
```

**Programmatic Configuration:**

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.networkConfig.connectionTimeout = 6000;
```

Its default value is `5000` milliseconds.

## 5.5. Setting Connection Attempt Limit

While the client is trying to connect initially to one of the members in the `ClientNetworkConfig.addresses`, that member might not be available at that moment. Instead of giving up, throwing an error and stopping the client, the client will retry as many as `ClientNetworkConfig.connectionAttemptLimit` times. This is also the case when the previously established connection between the client and that member goes down.

The following are example configurations.

**Declarative Configuration:**

```json
{
    "network": {
        "connectionAttemptLimit": 5
    }
}
```

**Programmatic Configuration:**

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.networkConfig.connectionAttemptLimit = 5;
```

Its default value is `2`.

## 5.6. Setting Connection Attempt Period

Connection attempt period is the duration in milliseconds between the connection attempts defined by `ClientNetworkConfig.connectionAttemptLimit`.

The following are example configurations.

**Declarative Configuration:**

```json
{
    "network": {
        "connectionAttemptPeriod": 5000
    }
}
```

**Programmatic Configuration:**

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.networkConfig.connectionAttemptPeriod = 5000;
```

Its default value is `3000` milliseconds.

## 5.7. Enabling Client TLS/SSL

You can use TLS/SSL to secure the connection between the clients and members. If you want to enable TLS/SSL
for the client-cluster connection, you should set an SSL configuration. Please see [TLS/SSL section](#61-tlsssl).

As explained in the [TLS/SSL section](#61-tlsssl), Hazelcast members have key stores used to identify themselves (to other members) and Hazelcast Node.js clients have certificate authorities used to define which members they can trust. Hazelcast has the mutual authentication feature which allows the Node.js clients also to have their private keys and public certificates, and members to have their certificate authorities so that the members can know which clients they can trust. See the [Mutual Authentication section](#613-mutual-authentication).

## 5.8. Enabling Hazelcast Cloud Discovery

The purpose of Hazelcast Cloud Discovery is to provide the clients to use IP addresses provided by `hazelcast orchestrator`. To enable Hazelcast Cloud Discovery, specify a token for the `discoveryToken` field and set the `enabled` field to `true`.

The following are example configurations.

**Declarative Configuration:**

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

**Programmatic Configuration:**

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.groupConfig.name = 'hazel';
clientConfig.groupConfig.password = 'cast';

clientConfig.networkConfig.cloudConfig.enabled = true;
clientConfig.networkConfig.cloudConfig.discoveryToken = 'EXAMPLE_TOKEN';
```

To be able to connect to the provided IP addresses, you should use secure TLS/SSL connection between the client and members. Therefore, you should set an SSL configuration as described in the previous section.

# 6. Securing Client Connection

This chapter describes the security features of Hazelcast Node.js client. These include using TLS/SSL for connections between members and between clients and members, and mutual authentication. These security features require **Hazelcast IMDG Enterprise** edition.

### 6.1. TLS/SSL

One of the offers of Hazelcast is the TLS/SSL protocol which you can use to establish an encrypted communication across your cluster with key stores and trust stores.

* A Java `keyStore` is a file that includes a private key and a public certificate. The equivalent of a key store is the combination of `key` and `cert` files at the Node.js client side.
* A Java `trustStore` is a file that includes a list of certificates trusted by your application which is named as  "certificate authority". The equivalent of a trust store is a `ca` file at the Node.js client side.

You should set `keyStore` and `trustStore` before starting the members. See the next section on setting `keyStore` and `trustStore` on the server side.

#### 6.1.1. TLS/SSL for Hazelcast Members

Hazelcast allows you to encrypt socket level communication between Hazelcast members and between Hazelcast clients and members, for end to end encryption. To use it, see the [TLS/SSL for Hazelcast Members section](http://docs.hazelcast.org/docs/latest/manual/html-single/index.html#tls-ssl-for-hazelcast-members).

#### 6.1.2. TLS/SSL for Hazelcast Node.js Clients

TLS/SSL for the Hazelcast Node.js client can be configured using the `SSLConfig` class. In order to turn it on, `enabled` property of `SSLConfig` should be set to `true`:

```javascript
var fs = require('fs');

var clientConfig = new Config.ClientConfig();
var sslConfig = new Config.SSLConfig();
sslConfig.enabled = true;
clientConfig.networkConfig.sslConfig = sslConfig;
```

`SSLConfig` object takes various SSL options defined in the [Node.js TLS Documentation](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback). You can set your custom options
object to `sslConfig.sslOptions`.

#### 6.1.3. Mutual Authentication

As explained above, Hazelcast members have key stores used to identify themselves (to other members) and Hazelcast clients have trust stores used to define which members they can trust.

Using mutual authentication, the clients also have their key stores and members have their trust stores so that the members can know which clients they can trust.

To enable mutual authentication, firstly, you need to set the following property on the server side in the `hazelcast.xml` file:

```xml
<network>
    <ssl enabled="true">
        <properties>
            <property name="javax.net.ssl.mutualAuthentication">REQUIRED</property>
        </properties>
    </ssl>
</network>
```

You can see the details of setting mutual authentication on the server side in the [Mutual Authentication section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#mutual-authentication) of the Hazelcast IMDG Reference Manual.

At the Node.js client side, you need to supply an SSL `options` object to pass to
[`tls.connect`](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback) of Node.js.

There are two ways to provide this object to the client:

1. Using the built-in `BasicSSLOptionsFactory` bundled with the client.
2. Writing an `SSLOptionsFactory`.

Below subsections describe each way.

**Using the Built-in `BasicSSLOptionsFactory`**

Hazelcast Node.js client includes a utility factory class that creates the necessary `options` object out of the supplied
properties. All you need to do is to specify your factory as `BasicSSLOptionsFactory` and provide the following options:

- `caPath`
- `keyPath`
- `certPath`
- `servername`
- `rejectUnauthorized`
- `ciphers`

See [`tls.connect`](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback) of Node.js for the descriptions of each option.

> `caPath`, `keyPath` and `certPath` define the file path to the respective file that stores such information.

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

**Writing an `SSLOptionsFactory`**

In order to use the full range of options provided to [`tls.connect`](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback) of Node.js, you may write your own factory object.

An example configuration is shown below.

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


An example of a factory, `My_Factory.js`, is shown below.


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

For information about the path resolution, see the [Loading Objects and Path Resolution section](#33-loading-objects-and-path-resolution).


# 7. Using Node.js Client with Hazelcast IMDG

This chapter provides information on how you can use Hazelcast IMDG's data structures in the Node.js client, after giving some basic information including an overview to the client API, operation modes of the client and how it handles the failures.

## 7.1. Node.js Client API Overview

Most of the functions in the API return `Promise`. Therefore, you need to be familiar with the concept of promises to use the Node.js client. If not, you can learn about them using various online resources, e.g., the [Promise JS](https://www.promisejs.org/) website.

Promises provide a better way of working with callbacks. You can chain asynchronous functions by the `then()` function of promise. Also, you can use `async/await`, if you use Node.js 8 and higher versions.

If you are ready to go, let's start to use Hazelcast Node.js client.

The first step is the configuration. You can configure the Node.js client declaratively or programmatically. We will use the programmatic approach throughout this chapter. See the [Programmatic Configuration section](#311-programmatic-configuration) for details.

The following is an example on how to create a `ClientConfig` object and configure it programmatically:

```javascript
var clientConfig = new Config.ClientConfig();
clientConfig.groupConfig.name = 'dev';
clientConfig.networkConfig.addresses.push('10.90.0.1', '10.90.0.2:5702');
```

The second step is initializing the `HazelcastClient` to be connected to the cluster:

```javascript
Client.newHazelcastClient(clientConfig).then(function (client) {
    // some operation
});
```

**This client object is your gateway to access all the Hazelcast distributed objects.**

Let's create a map and populate it with some data, as shown below.

```javascript
var map;
// Get the Distributed Map from Cluster.
client.getMap('my-distributed-map').then(function (mp) {
    map = mp;
    // Standard Put and Get.
    return map.put('key', 'value');
}).then(function () {
    return map.get('key');
}).then(function (val) {
    // Concurrent Map methods, optimistic updating
    return map.putIfAbsent('somekey', 'somevalue');
}).then(function () {
    return map.replace('key', 'value', 'newvalue');
});
```

As the final step, if you are done with your client, you can shut it down as shown below. This will release all the used resources and close connections to the cluster.

```javascript
...
.then(function () {
    client.shutdown();
});
```

## 7.2. Node.js Client Operation Modes

The client has two operation modes because of the distributed nature of the data and cluster: smart and unisocket.

### 7.2.1. Smart Client

In the smart mode, the clients connect to each cluster member. Since each data partition uses the well known and consistent hashing algorithm, each client can send an operation to the relevant cluster member, which increases the overall throughput and efficiency. Smart mode is the default mode.

### 7.2.2. Unisocket Client

For some cases, the clients can be required to connect to a single member instead of each member in the cluster. Firewalls, security or some custom networking issues can be the reason for these cases.

In the unisocket client mode, the client will only connect to one of the configured addresses. This single member will behave as a gateway to the other members. For any operation requested from the client, it will redirect the request to the relevant member and return the response back to the client returned from this member.

## 7.3. Handling Failures

There are two main failure cases you should be aware of. Below sections explain these and the configurations you can perform to achieve proper behavior.

### 7.3.1. Handling Client Connection Failure

While the client is trying to connect initially to one of the members in the `ClientNetworkConfig.addressList`, all the members might not be available. Instead of giving up, throwing an error and stopping the client, the client will retry as many as `connectionAttemptLimit` times.

You can configure `connectionAttemptLimit` for the number of times you want the client to retry connecting. See the [Setting Connection Attempt Limit section](#55-setting-connection-attempt-limit).

The client executes each operation through the already established connection to the cluster. If this connection(s) disconnects or drops, the client will try to reconnect as configured.

### 7.3.2. Handling Retry-able Operation Failure

While sending the requests to the related members, the operations can fail due to various reasons. Read-only operations are retried by default. If you want to enable retrying for the other operations, you can set the `redoOperation` to `true`. See the [Enabling Redo Operation section](#53-enabling-redo-operation).

You can set a timeout for retrying the operations sent to a member. This can be provided by using the property `hazelcast.client.invocation.timeout.seconds` in `ClientConfig.properties`. The client will retry an operation within this given period, of course, if it is a read-only operation or you enabled the `redoOperation` as stated in the above paragraph. This timeout value is important when there is a failure resulted by either of the following causes:

* Member throws an exception.
* Connection between the client and member is closed.
* Client’s heartbeat requests are timed out.

When a connection problem occurs, an operation is retried if it is certain that it has not run on the member yet or if it is idempotent such as a read-only operation, i.e., retrying does not have a side effect. If it is not certain whether the operation has run on the member, then the non-idempotent operations are not retried. However, as explained in the first paragraph of this section, you can force all the client operations to be retried (`redoOperation`) when there is a connection failure between the client and member. But in this case, you should know that some operations may run multiple times causing conflicts. For example, assume that your client sent a `queue.offer` operation to the member and then the connection is lost. Since there will be no response for this operation, you will not know whether it has run on the member or not. If you enabled `redoOperation`, it means this operation may run again, which may cause two instances of the same object in the queue.


## 7.4. Using Distributed Data Structures

Most of the distributed data structures are supported by the Node.js client. In this chapter, you will learn how to use these distributed data structures.

### 7.4.1. Using Map

Hazelcast Map (`IMap`) is a distributed map. Through the Node.js client, you can perform operations like reading and writing from/to a Hazelcast Map with the well known get and put methods. For details, see the [Map section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#map) in the Hazelcast IMDG Reference Manual.

A Map usage example is shown below.

```javascript
var map;
// Get the Distributed Map from Cluster.
client.getMap('my-distributed-map').then(function (mp) {
    map = mp;
    // Standard Put and Get.
    return map.put('key', 'value');
}).then(function () {
    return map.get('key');
}).then(function (val) {
    // Concurrent Map methods, optimistic updating
    return map.putIfAbsent('somekey', 'somevalue');
}).then(function () {
    return map.replace('key', 'value', 'newvalue');
});
```

Hazelcast Map supports a Near Cache for remotely stored entries to increase the performance of read operations. See the [Near Cache section](#782-near-cache) for a detailed explanation of the Near Cache feature and its configuration.

Hazelcast Map uses `MapListener` to listen to the events that occur when the entries are added to, updated/merged in or evicted/removed from the Map. See the [Map Listener section](#7521-map-listener) for information on how to create a map listener object and register it.

### 7.4.2. Using MultiMap

Hazelcast `MultiMap` is a distributed and specialized map where you can store multiple values under a single key. For details, see the [MultiMap section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#multimap) in the Hazelcast IMDG Reference Manual.

A MultiMap usage example is shown below.

```javascript
var multiMap;
// Get the Distributed MultiMap from Cluster.
hz.getMultiMap('my-distributed-multimap').then(function (mmp) {
    multiMap = mmp;
    // Put values in the map against the same key
    return multiMap.put('my-key', 'value1');
}).then(function () {
    return multiMap.put('my-key', 'value2');
}).then(function () {
    return multiMap.put('my-key', 'value3');
}).then(function () {
    // Print out all the values for associated with key called "my-key"
    return multiMap.get('my-key')
}).then(function (values) {
    for (value of values) {
        console.log(value);
    }
    // remove specific key/value pair
    return multiMap.remove('my-key', 'value2');
});
```

Hazelcast MultiMap uses `EntryListener` to listen to the events that occur when the entries are added to or removed from the MultiMap. See the [Entry Listener section](#7522-entry-listener) for information on how to create an entry listener object and register it.

### 7.4.3. Using Replicated Map

Hazelcast `ReplicatedMap` is a distributed key-value data structure where the data is replicated to all members in the cluster. It provides full replication of entries to all members for high speed access. For details, see the [Replicated Map section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#replicated-map) in the Hazelcast IMDG Reference Manual.

A Replicated Map usage example is shown below.

```javascript
var map;
// Get a Replicated Map called "my-replicated-map"
hz.getReplicatedMap('my-replicated-map').then(function (rmp) {
    map = rmp;
    // Put and Get a value from the Replicated Map
    // key/value replicated to all members
    return map.put('key', 'value');
}).then(function (replacedValue) {
    console.log('replaced value = ' + replacedValue); // Will be null as its first update
    return map.get('key');
}).then(function (value) {
    // The value is retrieved from a random member in the cluster
    console.log('value for key = ' + value);
});
```

Hazelcast Replicated Map uses `EntryListener` to listen to the events that occur when the entries are added to, updated in or evicted/removed from the Replicated Map. See the [Entry Listener section](#7522-entry-listener) for information on how to create an entry listener object and register it.

### 7.4.4. Using Queue

Hazelcast Queue (`IQueue`) is a distributed queue which enables all cluster members to interact with it. For details, see the [Queue section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#queue) in the Hazelcast IMDG Reference Manual.

A Queue usage example is shown below.

```javascript
var queue;
// Get a Blocking Queue called "my-distributed-queue"
hz.getQueue('my-distributed-queue').then(function (q) {
    queue = q;
    // Offer a String into the Distributed Queue
    return queue.offer('item');
}).then(function () {
    // Poll the Distributed Queue and return the String
    return queue.poll();
}).then(function () {
    // Timed blocking Operations
    return queue.offer('anotheritem', 500);
}).then(function () {
    return queue.poll(5000);
}).then(function () {
    // Indefinitely blocking Operations
    return queue.put('yetanotheritem');
}).then(function () {
    return queue.take();
}).then(function (value) {
    console.log(value);
});
```

Hazelcast Queue uses `ItemListener` to listen to the events that occur when the items are added to or removed from the Queue. See the [Item Listener section](#7523-item-listener) for information on how to create an item listener object and register it.

## 7.4.5. Using Set

Hazelcast Set (`ISet`) is a distributed set which does not allow duplicate elements. For details, see the [Set section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#set) in the Hazelcast IMDG Reference Manual.

A Set usage example is shown below.

```javascript
var set;
// Get the Distributed Set from Cluster.
hz.getSet('my-distributed-set').then(function (s) {
    set = s;
    // Add items to the set with duplicates
    return set.add('item1');
}).then(function () {
    return set.add('item1');
}).then(function () {
    return set.add('item2');
}).then(function () {
    return set.add('item2');
}).then(function () {
    return set.add('item2');
}).then(function () {
    return set.add('item3');
}).then(function () {
    // Get the items. Note that there are no duplicates
    return set.toArray();
}).then(function (values) {
    console.log(values);
});
```

Hazelcast Set uses `ItemListener` to listen to the events that occur when the items are added to or removed from the Set. See the [Item Listener section](#7523-item-listener) for information on how to create an item listener object and register it.

## 7.4.6. Using List

Hazelcast List (`IList`) is a distributed list which allows duplicate elements and preserves the order of elements. For details, see the [List section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#list) in the Hazelcast IMDG Reference Manual.

A List usage example is shown below.

```javascript
var list;
// Get the Distributed List from Cluster.
hz.getList('my-distributed-list').then(function (l) {
    list = l;
    // Add elements to the list
    return list.add('item1');
}).then(function () {
    return list.add('item2');
}).then(function () {
    //Remove the first element
    return list.removeAt(0);
}).then(function (value) {
    console.log(value);
    // There is only one element left
    return list.size();
}).then(function (len) {
    console.log(len);
    // Clear the list
    return list.clear();
});
```

Hazelcast List uses `ItemListener` to listen to the events that occur when the items are added to or removed from the List. See the [Item Listener section](#7523-item-listener) for information on how to create an item listener object and register it.

## 7.4.7. Using Ringbuffer

Hazelcast `Ringbuffer` is a replicated but not partitioned data structure that stores its data in a ring-like structure. You can think of it as a circular array with a given capacity. Each Ringbuffer has a tail and a head. The tail is where the items are added and the head is where the items are overwritten or expired. You can reach each element in a Ringbuffer using a sequence ID, which is mapped to the elements between the head and tail (inclusive) of the Ringbuffer. For details, see the [Ringbuffer section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#ringbuffer) in the Hazelcast IMDG Reference Manual.

A Ringbuffer usage example is shown below.

```javascript
var rb;
// Get a Ringbuffer called "rb"
hz.getRingbuffer('rb').then(function (buffer) {
    rb = buffer;
    return rb.add(100);
}).then(function () {
    return rb.add(200);
}).then(function (value) {
    // we start from the oldest item.
    // if you want to start from the next item, call rb.tailSequence()+1
    return rb.headSequence();
}).then(function (sequence) {
    return rb.readOne(sequence).then(function (value) {
        console.log(value);
        return rb.readOne(sequence.add(1));
    }).then(function (value) {
        console.log(value);
    });
});
```

## 7.4.8. Using Reliable Topic

Hazelcast `ReliableTopic` is a distributed topic implementation backed up by the `Ringbuffer` data structure. For details, see the [Reliable Topic section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#reliable-topic) in the Hazelcast IMDG Reference Manual.

A Reliable Topic usage example is shown below.

```javascript
var topic;
// Get a Topic called "my-distributed-topic"
hz.getReliableTopic("my-distributed-topic").then(function (t) {
    topic = t;
    // Add a Listener to the Topic
    topic.addMessageListener(function (message) {
        console.log(message);
    });
    // Publish a message to the Topic
    return topic.publish('Hello to distributed world');
});
```

Hazelcast Reliable Topic uses `MessageListener` to listen to the events that occur when a message is received. See the [Message Listener section](#7524-message-listener) for information on how to create a message listener object and register it.

## 7.4.9. Using Lock

Hazelcast Lock (`ILock`) is a distributed lock implementation. You can synchronize Hazelcast members and clients using a Lock. For details, see the [Lock section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#lock) in the Hazelcast IMDG Reference Manual.

A Lock usage example is shown below.

```javascript
var lock;
// Get a distributed lock called "my-distributed-lock"
hz.getLock("my-distributed-lock").then(function (l) {
    lock = l;
    // Now create a lock and execute some guarded code.
    return lock.lock();
}).then(function () {
    // do something here
}).finally(function () {
    return lock.unlock();
});
```

## 7.4.10. Using Atomic Long

Hazelcast Atomic Long (`IAtomicLong`) is the distributed long which offers most of the operations such as `get`, `set`, `getAndSet`, `compareAndSet` and `incrementAndGet`. For details, see the [Atomic Long section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#iatomiclong) in the Hazelcast IMDG Reference Manual.

An Atomic Long usage example is shown below.

```javascript
var counter;
// Get an Atomic Counter, we'll call it "counter"
hz.getAtomicLong("counter").then(function (c) {
    counter = c;
    // Add and Get the "counter"
    return counter.addAndGet(3);
}).then(function (value) {
    return counter.get();
}).then(function (value) {
    // Display the "counter" value
    console.log("counter: " + value);
});
```

## 7.4.11. Using Semaphore

Hazelcast Semaphore (`ISemaphore`) is a distributed semaphore implementation. For details, see the [Semaphore section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#isemaphore) in the Hazelcast IMDG Reference Manual.

A Semaphore usage example is shown below.

```javascript
var semaphore;
hazelcastClient.getSemaphore('mySemaphore').then(function (s) {
    semaphore = s;
    return semaphore.init(10);
}).then(function () {
    return semaphore.acquire(5);
}).then(function () {
    return semaphore.availablePermits();
}).then(function (res) {
    console.log(res); // 5
});
```

## 7.4.12. Using PN Counter

Hazelcast `PNCounter` (Positive-Negative Counter) is a CRDT positive-negative counter implementation. It is an eventually consistent counter given there is no member failure. For details, see the [PN Counter section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#pn-counter) in the Hazelcast IMDG Reference Manual.

A PN Counter usage example is shown below.

```javascript
var pnCounter;
hazelcastClient.getPNCounter('myPNCounter').then(function (counter) {
    pnCounter = counter;
    return pnCounter.addAndGet(5);
}).then(function (value) {
    console.log(value); // 5
    return pnCounter.decrementAndGet();
}).then(function (value) {
    console.log(value); // 4
});
```

## 7.4.13. Using Flake ID Generator

Hazelcast `FlakeIdGenerator` is used to generate cluster-wide unique identifiers. Generated identifiers are long primitive values and are k-ordered (roughly ordered). IDs are in the range from 0 to `2^63-1` (maximum signed long value). For details, see the [FlakeIdGenerator section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#flakeidgenerator) in the Hazelcast IMDG Reference Manual.

A Flake ID Generator usage example is shown below.

```javascript
var flakeIdGenerator;
hazelcastClient.getFlakeIdGenerator('myFlakeIdGenerator').then(function (gen) {
    flakeIdGenerator = gen;
    return flakeIdGenerator.newId();
}).then(function (value) {
    console.log('New id: ' + value.toString());
});
```

## 7.5. Distributed Events

This chapter explains when various events are fired and describes how you can add event listeners on a Hazelcast Node.js client. These events can be categorized as cluster and distributed data structure events.

### 7.5.1. Listening for Cluster Events

You can add event listeners to a Hazelcast Node.js client. You can configure the following listeners to listen to the events on the client side:

* Membership Listener: Notifies when a member joins to/leaves the cluster, or when an attribute is changed in a member.
* Distributed Object Listener: Notifies when a distributed object is created or destroyed throughout the cluster.
* Lifecycle Listener: Notifies when the client is starting, started, shutting down and shutdown.

#### 7.5.1.1. Membership Listener

The Membership Listener interface has functions that are invoked for the following events.

* `memberAdded`: A new member is added to the cluster.
* `memberRemoved`: An existing member leaves the cluster.
* `memberAttributeChanged`: An attribute of a member is changed. See the [Defining Member Attributes section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#defining-member-attributes) in the Hazelcast IMDG Reference Manual to learn about member attributes.

For `memberAdded` and `memberRemoved` events, a `MembershipEvent` object is passed to the listener function.

After you create the listener object, you can configure your cluster to include the membership listener. You can also add one or more membership listeners.

The following is a membership listener registration by using the `ClusterService.addMembershipListener()` function.

```javascript
var membershipListener = {
    memberAdded: function (membershipEvent) {
        console.log('Member Added: The address is', member.address.toString());
    },
};
client.clusterService.addMembershipListener(membershipListener);
```

The `memberAttributeChanged` has its own type of event named as `MemberAttributeEvent`. When there is an attribute change on the member, this event is fired.

See the following example.

```javascript

var membershipListener = {
    memberAttributeChanged: function (memberAttributeEvent) {
       console.log('Member Attribute Changed: The address is', memberAttributeEvent.member.address.toString());
    },
};
client.clusterService.addMembershipListener(membershipListener);
```

#### 7.5.1.2. Distributed Object Listener

The events for distributed objects are invoked when they are created and destroyed in the cluster. After the events, a listener callback function is called. The type of the callback function should be `DistributedObjectListener`. The parameter of the function is `DistributedObjectEvent` including following fields:

* `serviceName`: Service name of the distributed object.
* `objectName`: Name of the distributed object.
* `eventType`: Type of the invoked event. It can be `created` or `destroyed`.

The following is an example of adding a `DistributedObjectListener`.

```javascript
client.addDistributedObjectListener(function (distributedObjectEvent) {
    console.log('Distributed object event >>> ',
        distributedObjectEvent.serviceName,
        distributedObjectEvent.objectName,
        distributedObjectEvent.eventType
    );
}).then(function () {
    var mapname = 'test';
    // this causes a created event
    client.getMap(mapname);
    // this causes no event because map was already created
    client.getMap(mapname);
});
```

#### 7.5.1.3. Lifecycle Listener

The `LifecycleListener` interface notifies for the following events:

* `starting`: A client is starting.
* `started`: A client has started.
* `shuttingDown`: A client is shutting down.
* `shutdown`: A client’s shutdown has completed.

The following is an example of the `LifecycleListener` that is added to the `ClientConfig` object and its output.

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

### 7.5.2. Listening for Distributed Data Structure Events

You can add event listeners to the distributed data structures.

> **NOTE: Hazelcast Node.js client is a TypeScript-based project but JavaScript does not have interfaces. Therefore,
  some interfaces are given to the user by using the TypeScript files that have `.ts` extension. In this guide, implementing an interface means creating an object to have the necessary functions that are listed in the interface inside the `.ts` file. Also, this object is mentioned as `an instance of the interface`. You can search the [API Documentation](http://hazelcast.github.io/hazelcast-nodejs-client/api/current/docs/) or GitHub repository for a required interface.**

#### 7.5.2.1. Map Listener

The Map Listener is used by the Hazelcast `Map`.

You can listen to map-wide or entry-based events by using the functions in the `MapListener` interface. Every function type in this interface is one of the `EntryEventListener` and `MapEventListener` types. To listen to these events, you need to implement the relevant `EntryEventListener` and `MapEventListener` functions in the `MapListener` interface.

An entry-based event is fired after the operations that affect a specific entry. For example, `IMap.put()`, `IMap.remove()` or `IMap.evict()`. You should use the `EntryEventListener` type to listen to these events. An `EntryEvent` object is passed to the listener function.

See the following example.

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

A map-wide event is fired as a result of a map-wide operation. For example, `IMap.clear()` or `IMap.evictAll()`. You should use the `MapEventListener` type to listen to these events. A `MapEvent` object is passed to the listener function.

See the following example.

```javascript
var mapEventListener = {
    mapCleared: function (mapEvent) {
        console.log('Map Cleared:', mapEvent.numberOfAffectedEntries); // Map Cleared: 3
    }
};
map.addEntryListener(mapEventListener).then(function () {
    return map.put('1', 'Muhammet Ali');
}).then(function () {
    return map.put('2', 'Ahmet');
}).then(function () {
    return map.put('3', 'Furkan');
}).then(function () {
    return map.clear();
});
```

As you see, there is a parameter in the `addEntryListener` function: `includeValue`. It is a boolean parameter, and if it is `true`, the map event contains the entry value.

#### 7.5.2.2. Entry Listener

The Entry Listener is used by the Hazelcast `MultiMap` and `ReplicatedMap`.

You can listen to map-wide or entry-based events by using the functions in the `EntryListener` interface. Every function type in this interface is one of the `EntryEventListener` and `MapEventListener` types. To listen to these events, you need to implement the relevant `EntryEventListener` and `MapEventListener` functions in the `EntryListener` interface.

An entry-based event is fired after the operations that affect a specific entry. For example, `MultiMap.put()`, `MultiMap.remove()`. You should use the `EntryEventListener` type to listen to these events. An `EntryEvent` object is passed to the listener function.

```javascript
var entryEventListener = {
    added: function (entryEvent) {
        console.log('Entry Added:', entryEvent.key, entryEvent.value); // Entry Added: 1 Furkan
    }
};
return mmp.addEntryListener(entryEventListener, undefined, true).then(function () {
    return mmp.put('1', 'Furkan');
});
```

A map-wide event is fired as a result of a map-wide operation. For example, `MultiMap.clear()`. You should use the `MapEventListener` type to listen to these events. A `MapEvent` object is passed to the listener function.

See the following example.

```javascript
var mapEventListener = {
    mapCleared: function (mapEvent) {
        console.log('Map Cleared:', mapEvent.numberOfAffectedEntries); // Map Cleared: 1
    }
};
mmp.addEntryListener(mapEventListener).then(function () {
    return mmp.put('1', 'Muhammet Ali');
}).then(function () {
    return mmp.put('1', 'Ahmet');
}).then(function () {
    return mmp.put('1', 'Furkan');
}).then(function () {
    return mmp.clear();
});
```

Note that all functions in the `EntryListener` interface is not supported by MultiMap and Replicated Map. See the following headings to see supported listener functions for each data structure.

**Entry Listener Functions Supported by MultiMap**

- `added`
- `removed`
- `mapCleared`

**Entry Listener Functions Supported by Replicated Map**

- `added`
- `removed`
- `updated`
- `evicted`
- `mapCleared`

As you see, there is a parameter in the `addEntryListener` function: `includeValue`. It is a boolean parameter, and if it is `true`, the entry event contains the entry value.

#### 7.5.2.3. Item Listener

The Item Listener is used by the Hazelcast `Queue`, `Set` and `List`.

You can listen to item events by implementing the functions in the `ItemListener` interface including `itemAdded` and `itemRemoved`. These functions are invoked when an item is added or removed.

The following is an example of item listener object and its registration to the `Set`. It also applies to `Queue` and `List`.

```javascript
var itemListener = {
    itemAdded: function (itemEvent) {
        console.log('Item Added:', itemEvent.item); // Item Added: Furkan
    },
    itemRemoved: function (itemEvent) {
        console.log('Item Removed:', itemEvent.item); // Item Removed: Furkan
    }
};
return set.addItemListener(itemListener, true).then(function () {
    return set.add('Furkan');
}).then(function () {
    return set.remove('Furkan');
});
```

As you see, there is a parameter in the `addItemListener` function: `includeValue`. It is a boolean parameter, and if it is `true`, the item event contains the item value.

#### 7.5.2.4. Message Listener

The Message Listener is used by the Hazelcast `Reliable Topic`.

You can listen to message events. To listen to these events, you need to implement the `MessageListener` function to which a `Message` object is passed.

See the following example.

```javascript
topic.addMessageListener(function (message) {
    console.log(message.messageObject);
});

var engineer = {
    name: 'Furkan Senharputlu',
    age: 23,
    field: 'Computer Engineering',
    university: 'Bogazici University'
}
topic.publish(engineer);
```

## 7.6. Distributed Computing

This chapter explains how you can use Hazelcast IMDG's entry processor implementation in the Node.js client.

### 7.6.1. Using EntryProcessor

Hazelcast supports entry processing. An entry processor is a function that executes your code on a map entry in an atomic way.

An entry processor is a good option if you perform bulk processing on an `IMap`. Usually you perform a loop of keys -- executing `IMap.get(key)`, mutating the value and finally putting the entry back in the map using `IMap.put(key,value)`. If you perform this process from a client or from a member where the keys do not exist, you effectively perform two network hops for each update: the first to retrieve the data and the second to update the mutated value.

If you are doing the process described above, you should consider using entry processors. An entry processor executes a read and updates upon the member where the data resides. This eliminates the costly network hops described above.

> **NOTE: Entry processor is meant to process a single entry per call. Processing multiple entries and data structures in an entry processor is not supported as it may result in deadlocks on the server side.**

Hazelcast sends the entry processor to each cluster member and these members apply it to the map entries. Therefore, if you add more members, your processing completes faster.

#### Processing Entries

The `IMap` interface provides the following functions for entry processing:

* `executeOnKey` processes an entry mapped by a key.
* `executeOnKeys` processes entries mapped by a list of keys.
* `executeOnEntries` can process all entries in a map with a defined predicate. Predicate is optional.

In the Node.js client, an `EntryProcessor` should be `IdentifiedDataSerializable` or `Portable` because the server should be able to deserialize it to process.

The following is an example for `EntryProcessor` which is `IdentifiedDataSerializable`.

```javascript
function IdentifiedEntryProcessor(value) {
    this.value = value;
}

IdentifiedEntryProcessor.prototype.readData = function (inp) {
    this.value = inp.readUTF();
};

IdentifiedEntryProcessor.prototype.writeData = function (outp) {
    outp.writeUTF(this.value);
};

IdentifiedEntryProcessor.prototype.getFactoryId = function () {
    return 5;
};

IdentifiedEntryProcessor.prototype.getClassId = function () {
    return 1;
};
```

Now, you need to make sure that the Hazelcast member recognizes the entry processor. For this, you need to implement the Java equivalent of your entry processor and its factory, and create your own compiled class or JAR files. For adding your own compiled class or JAR files to the server's `CLASSPATH`, see the [Adding User Library to CLASSPATH section](#1213-adding-user-library-to-classpath).

The following is the Java equivalent of the entry processor in Node.js client given above:

```java
import com.hazelcast.map.AbstractEntryProcessor;
import com.hazelcast.nio.ObjectDataInput;
import com.hazelcast.nio.ObjectDataOutput;
import com.hazelcast.nio.serialization.IdentifiedDataSerializable;
import java.io.IOException;
import java.util.Map;

public class IdentifiedEntryProcessor extends AbstractEntryProcessor<String, String> implements IdentifiedDataSerializable {
     static final int CLASS_ID = 1;
     private String value;

    public IdentifiedEntryProcessor() {
    }

     @Override
    public int getFactoryId() {
        return IdentifiedFactory.FACTORY_ID;
    }

     @Override
    public int getId() {
        return CLASS_ID;
    }

     @Override
    public void writeData(ObjectDataOutput out) throws IOException {
        out.writeUTF(value);
    }

     @Override
    public void readData(ObjectDataInput in) throws IOException {
        value = in.readUTF();
    }

     @Override
    public Object process(Map.Entry<String, String> entry) {
        entry.setValue(value);
        return value;
    }
}
```

You can implement the above processor’s factory as follows:

```java
import com.hazelcast.nio.serialization.DataSerializableFactory;
import com.hazelcast.nio.serialization.IdentifiedDataSerializable;

public class IdentifiedFactory implements DataSerializableFactory {
    public static final int FACTORY_ID = 5;

     @Override
    public IdentifiedDataSerializable create(int typeId) {
        if (typeId == IdentifiedEntryProcessor.CLASS_ID) {
            return new IdentifiedEntryProcessor();
        }
        return null;
    }
}
```

Now you need to configure the `hazelcast.xml` to add your factory as shown below.

```xml
<hazelcast>
    <serialization>
        <data-serializable-factories>
            <data-serializable-factory factory-id="5">
                IdentifiedFactory
            </data-serializable-factory>
        </data-serializable-factories>
    </serialization>
</hazelcast>
```

The code that runs on the entries is implemented in Java on the server side. The client side entry processor is used to specify which entry processor should be called. For more details about the Java implementation of the entry processor, see the [Entry Processor section](https://docs.hazelcast.org/docs/latest/manual/html-single/index.html#entry-processor) in the Hazelcast IMDG Reference Manual.

After the above implementations and configuration are done and you start the server where your library is added to its `CLASSPATH`, you can use the entry processor in the `IMap` functions. See the following example.

```javascript
var map;
hazelcastClient.getMap('my-distributed-map').then(function (mp) {
    map = mp;
    return map.put('key', 'not-processed');
}).then(function () {
    return map.executeOnKey('key', new IdentifiedEntryProcessor('processed'));
}).then(function () {
    return map.get('key');
}).then(function (value) {
    console.log(value); // processed
});
```

## 7.7. Distributed Query

Hazelcast partitions your data and spreads it across cluster of members. You can iterate over the map entries and look for certain entries (specified by predicates) you are interested in. However, this is not very efficient because you will have to bring the entire entry set and iterate locally. Instead, Hazelcast allows you to run distributed queries on your distributed map.

### 7.7.1. How Distributed Query Works

1. The requested predicate is sent to each member in the cluster.
2. Each member looks at its own local entries and filters them according to the predicate. At this stage, key-value pairs of the entries are deserialized and then passed to the predicate.
3. The predicate requester merges all the results coming from each member into a single set.

Distributed query is highly scalable. If you add new members to the cluster, the partition count for each member is reduced and thus the time spent by each member on iterating its entries is reduced. In addition, the pool of partition threads evaluates the entries concurrently in each member, and the network traffic is also reduced since only filtered data is sent to the requester.

**Predicates Object Operators**

The `Predicates` object offered by the Node.js client includes many operators for your query requirements. Some of them are described below.

* `equal`: Checks if the result of an expression is equal to a given value.
* `notEqual`: Checks if the result of an expression is not equal to a given value.
* `instanceOf`: Checks if the result of an expression has a certain type.
* `like`: Checks if the result of an expression matches some string pattern. `%` (percentage sign) is the placeholder for many characters, `_` (underscore) is the placeholder for only one character.
* `greaterThan`: Checks if the result of an expression is greater than a certain value.
* `greaterEqual`: Checks if the result of an expression is greater than or equal to a certain value.
* `lessThan`: Checks if the result of an expression is less than a certain value.
* `lessEqual`: Checks if the result of an expression is less than or equal to a certain value.
* `between`: Checks if the result of an expression is between two values, inclusively.
* `inPredicate`: Checks if the result of an expression is an element of a certain list.
* `not`: Checks if the result of an expression is false.
* `regex`: Checks if the result of an expression matches some regular expression.

Hazelcast offers the following ways for distributed query purposes:

* Combining Predicates with AND, OR, NOT
* Distributed SQL Query

#### 7.7.1.1. Employee Map Query Example

Assume that you have an `employee` map containing the values of `Employee` objects, as coded below.

```javascript
function Employee(name, age, active, salary) {
    this.name = name;
    this.age = age;
    this.active = active;
    this.salary = salary;
}

Employee.prototype.getClassId = function () {
    return 1;
}

Employee.prototype.getFactoryId = function () {
    return 1;
}

Employee.prototype.readPortable = function (reader) {
    this.name = reader.readUTF();
    this.age = reader.readInt();
    this.active = reader.readBoolean();
    this.salary = reader.readDouble();
}

Employee.prototype.writePortable = function (writer) {
    writer.writeUTF(this.name);
    writer.writeInt(this.age);
    writer.writeBoolean(this.active);
    writer.writeDouble(this.salary);
}
```

Note that `Employee` is a `Portable` object. As portable types are not deserialized on the server side for querying, you don't need to implement its Java equivalent on the server side.

For the non-portable types, you need to implement its Java equivalent and its serializable factory on the server side for server to reconstitute the objects from binary formats. In this case before starting the server, you need to compile the Employee and related factory classes with server's CLASSPATH and add them to the user-lib directory in the extracted hazelcast-<version>.zip (or tar).  See the [Adding User Library to CLASSPATH section](#1213-adding-user-library-to-classpath).

> **NOTE: Querying with `Portable` object is faster as compared to `IdentifiedDataSerializable`.**

#### 7.7.1.2. Querying by Combining Predicates with AND, OR, NOT

You can combine predicates by using the `and`, `or` and `not` operators, as shown in the below example.

```javascript
var map;
client.getMap('employee').then(function (mp) {
    map = mp;
    var predicate = Predicates.and(Predicates.equal('active', true), Predicates.lessThan('age', 30));
    return map.valuesWithPredicate(predicate);
}).then(function (employees) {
    // some operations
});
```

In the above example code, `predicate` verifies whether the entry is active and its `age` value is less than 30. This `predicate` is applied to the `employee` map using the `map.valuesWithPredicate(predicate)` method. This method sends the predicate to all cluster members and merges the results coming from them.

> **NOTE: Predicates can also be applied to `keySet` and `entrySet` of the Hazelcast IMDG's distributed map.**

#### 7.7.1.3. Querying with SQL

`SqlPredicate` takes the regular SQL `where` clause. See the following example:

```javascript
var map;
client.getMap('employee').then(function (mp) {
    map = mp;
    return map.valuesWithPredicate(new SqlPredicate('active AND age < 30'));
}).then(function (employees) {
    // some operations
});
```

##### Supported SQL Syntax

**AND/OR:** `<expression> AND <expression> AND <expression>…`

- `active AND age > 30`
- `active = false OR age = 45 OR name = 'Joe'`
- `active AND ( age > 20 OR salary < 60000 )`

**Equality:** `=, !=, <, ⇐, >, >=`

- `<expression> = value`
- `age <= 30`
- `name = 'Joe'`
- `salary != 50000`

**BETWEEN:** `<attribute> [NOT] BETWEEN <value1> AND <value2>`

- `age BETWEEN 20 AND 33 ( same as age >= 20 AND age ⇐ 33 )`
- `age NOT BETWEEN 30 AND 40 ( same as age < 30 OR age > 40 )`

**IN:** `<attribute> [NOT] IN (val1, val2,…)`

- `age IN ( 20, 30, 40 )`
- `age NOT IN ( 60, 70 )`
- `active AND ( salary >= 50000 OR ( age NOT BETWEEN 20 AND 30 ) )`
- `age IN ( 20, 30, 40 ) AND salary BETWEEN ( 50000, 80000 )`

**LIKE:** `<attribute> [NOT] LIKE 'expression'`

The `%` (percentage sign) is the placeholder for multiple characters, an `_` (underscore) is the placeholder for only one character.

- `name LIKE 'Jo%'` (true for 'Joe', 'Josh', 'Joseph' etc.)
- `name LIKE 'Jo_'` (true for 'Joe'; false for 'Josh')
- `name NOT LIKE 'Jo_'` (true for 'Josh'; false for 'Joe')
- `name LIKE 'J_s%'` (true for 'Josh', 'Joseph'; false 'John', 'Joe')

**ILIKE:** `<attribute> [NOT] ILIKE 'expression'`

ILIKE is similar to the LIKE predicate but in a case-insensitive manner.

- `name ILIKE 'Jo%'` (true for 'Joe', 'joe', 'jOe','Josh','joSH', etc.)
- `name ILIKE 'Jo_'` (true for 'Joe' or 'jOE'; false for 'Josh')

**REGEX:** `<attribute> [NOT] REGEX 'expression'`

- `name REGEX 'abc-.*'` (true for 'abc-123'; false for 'abx-123')

##### Querying Examples with Predicates

You can use the `__key` attribute to perform a predicated search for the entry keys. See the following example:

```javascript
var personMap;
client.getMap('persons').then(function (mp) {
    personMap = mp;
    return personMap.put('Alice', 35);
}).then(function () {
    return personMap.put('Andy', 37);
}).then(function () {
    return personMap.put('Bob', 22);
}).then(function () {
    var predicate = new Predicates.sql('__key like A%');
    return personMap.valuesWithPredicate(predicate);
}).then(function (startingWithA) {
    console.log(startingWithA.get(0)); // 35
});
```

In this example, the code creates a list with the values whose keys start with the letter "A”.

You can use the `this` attribute to perform a predicated search for entry values. See the following example:

```javascript
var personMap;
return client.getMap('persons').then(function (mp) {
    personMap = mp;
    return personMap.put('Alice', 35);
}).then(function () {
    return personMap.put('Andy', 37);
}).then(function () {
    return personMap.put('Bob', 22);
}).then(function () {
    var predicate = new Predicates.greaterEqual('this', 27);
    return personMap.valuesWithPredicate(predicate);
}).then(function (olderThan27) {
    console.log(olderThan27.get(0), olderThan27.get(1)); // 35 37
});
```

In this example, the code creates a list with the values greater than or equal to "27".

#### 7.7.1.4. Filtering with Paging Predicates

The Node.js client provides paging for defined predicates. With its `PagingPredicate` object, you can get a list of keys, values or entries page by page by filtering them with predicates and giving the size of the pages. Also, you can sort the entries by specifying comparators.

```javascript
var map;
hazelcastClient.getMap('students').then(function (mp) {
    map = mp;

    var greaterEqual = Predicates.greaterEqual('age', 18);
    var pagingPredicate = Predicates.paging(greaterEqual, 5);

// Set page to retrieve third page
    pagingPredicate.setPage(3);

    // Retrieve third page
    return map.valuesWithPredicate(pagingPredicate)
}).then(function (values) {
    // some operations
...

    // Set up next page
    pagingPredicate.nextPage();

    // Retrieve next page
    return map.valuesWithPredicate(pagingPredicate);
}).then(function (values) {
    // some operations
});
```

If you want to sort the result before paging, you need to specify a comparator object that implements the `Comparator` interface. Also, this comparator object should be one of `IdentifiedDataSerializable` or `Portable`. After implementing this object in Node.js, you need to implement the Java equivalent of it and its factory. The Java equivalent of the comparator should implement `java.util.Comparator`. Note that the `compare` function of `Comparator` on the Java side is the equivalent of the `sort` function of `Comparator` on the Node.js side. When you implement the `Comparator` and its factory, you can add them to the `CLASSPATH` of the server side.  See the [Adding User Library to CLASSPATH section](#1213-adding-user-library-to-classpath).

Also, you can access a specific page more easily with the help of the `setPage` function. This way, if you make a query for the 100th page, for example, it will get all 100 pages at once instead of reaching the 100th page one by one using the `nextPage` function.

### 7.7.2. Fast-Aggregations

Fast-Aggregations feature provides some aggregate functions, such as `sum`, `average`, `max`, and `min`, on top of Hazelcast `IMap` entries. Their performance is perfect since they run in parallel for each partition and are highly optimized for speed and low memory consumption.

The `Aggregators` object provides a wide variety of built-in aggregators. The full list is presented below:

- `count`
- `doubleAvg`
- `doubleSum`
- `numberAvg`
- `fixedPointSum`
- `floatingPointSum`
- `max`
- `min`
- `integerAvg`
- `integerSum`
- `longAvg`
- `longSum`

You can use these aggregators with the `IMap.aggregate()` and `IMap.aggregateWithPredicate()` functions.

See the following example.

```javascript
var map;
hazelcastClient.getMap('brothersMap').then(function (mp) {
    map = mp;
    return map.putAll([
        ['Muhammet Ali', 30],
        ['Ahmet', 27],
        ['Furkan', 23],
    ]);
}).then(function () {
    return map.aggregate(Aggregators.count());
}).then(function (count) {
    console.log('There are ' + count + ' brothers.'); // There are 3 brothers.
    return map.aggregateWithPredicate(Aggregators.count(), Predicates.greaterThan('this', 25));
}).then(function (count) {
    console.log('There are ' + count + ' brothers older than 25.'); // There are 2 brothers older than 25.
    return map.aggregate(Aggregators.numberAvg());
}).then(function (avgAge) {
    console.log('Average age is ' + avgAge); // Average age is 26.666666666666668
});
```

## 7.8. Performance

### 7.8.1. Partition Aware

Partition Aware ensures that the related entries exist on the same member. If the related data is on the same member, operations can be executed without the cost of extra network calls and extra wire data, and this improves the performance. This feature is provided by using the same partition keys for related data.

Hazelcast has a standard way of finding out which member owns/manages each key object. The following operations are routed to the same member, since all of them are operating based on the same key `'key1'`.

```javascript
Client.newHazelcastClient().then(function (client) {
    hazelcastClient = client;
    return hazelcastClient.getMap('mapA')
}).then(function (mp) {
    mapA = mp;
    return hazelcastClient.getMap('mapB');
}).then(function (mp) {
    mapB = mp;
    return hazelcastClient.getMap('mapC');
}).then(function (mp) {
    mapC = mp;

    // since map names are different, operation is manipulating
    // different entries, but the operation takes place on the
    // same member since the keys ('key1') are the same
    return mapA.put('key1', 'Furkan');
}).then(function () {
    return mapB.get('key1');
}).then(function (res) {
    return mapC.remove('key1');
}).then(function () {
    // lock operation is still execute on the same member
    // of the cluster since the key ("key1") is same
    return hazelcastClient.getLock('key1');
}).then(function (l) {
    lock = l;
    return lock.lock();
});
```

When the keys are the same, entries are stored on the same member. However, we sometimes want to have the related entries stored on the same member, such as a customer and his/her order entries. We would have a customers map with `customerId` as the key and an orders map with `orderId` as the key. Since `customerId` and `orderId` are different keys, a customer and his/her orders may fall into different members in your cluster. So how can we have them stored on the same member? We create an affinity between the customer and orders. If we make them part of the same partition then these entries will be co-located. We achieve this by making `OrderKey`s `PartitionAware`.

```javascript
function OrderKey(orderId, customerId) {
    this.orderId = orderId;
    this.customerId = customerId;
}

OrderKey.prototype.getPartitionKey = function () {
    return this.customerId;
};
```

Notice that `OrderKey` implements `PartitionAware` interface and that `getPartitionKey()` returns the `customerId`. This will make sure that the `Customer` entry and its `Order`s will be stored on the same member.

```javascript
var hazelcastClient;
var mapCustomers;
var mapOrders;

Client.newHazelcastClient().then(function (client) {
    hazelcastClient = client;
    return hazelcastClient.getMap('customers')
}).then(function (mp) {
    mapCustomers = mp;
    return hazelcastClient.getMap('orders');
}).then(function (mp) {
    mapOrders = mp;

    // create the customer entry with customer id = 1
    return mapCustomers.put(1, customer);
}).then(function () {
    // now create the orders for this customer
    return mapOrders.putAll([
        [new OrderKey(21, 1), order],
        [new OrderKey(22, 1), order],
        [new OrderKey(23, 1), order]
    ]);
});
```

For more details, see the [PartitionAware section](https://docs.hazelcast.org/docs/latest/manual/html-single/#partitionaware) in the Hazelcast IMDG Reference Manual.

### 7.8.2. Near Cache

Map entries in Hazelcast are partitioned across the cluster members. Hazelcast clients do not have local data at all. Suppose you read the key `k` a number of times from a Hazelcast client and `k` is owned by a member in your cluster. Then each `map.get(k)` will be a remote operation, which creates a lot of network trips. If you have a map that is mostly read, then you should consider creating a local Near Cache, so that reads are sped up and less network traffic is created.

These benefits do not come for free, please consider the following trade-offs:

- If invalidation is enabled and entries are updated frequently, then invalidations will be costly.

- Near Cache breaks the strong consistency guarantees; you might be reading stale data.

- Clients with a Near Cache will have to hold the extra cached data, which increases memory consumption.

Near Cache is highly recommended for maps that are mostly read.

#### 7.8.2.1. Configuring Near Cache

The following snippets show how a Near Cache is configured in the Node.js client, presenting all available values for each element:

**Declarative Configuration:**

```
{
    "nearCaches": [
        {
            "name": "mostlyReadMap",
            "invalidateOnChange": (false|true),
            "timeToLiveSeconds": (0..Number.MAX_SAFE_INTEGER),
            "maxIdleSeconds": (0..Number.MAX_SAFE_INTEGER),
            "inMemoryFormat": "(object|binary)",
            "evictionPolicy": "lru|lfu|random|none",
            "evictionMaxSize": (0..Number.MAX_SAFE_INTEGER),
            "evictionSamplingCount": (0..Number.MAX_SAFE_INTEGER),
            "evictionSamplingPoolSize": (0..Number.MAX_SAFE_INTEGER),
        }
    ]
}
```

**Programmatic Configuration:**

```javascript
var nearCacheConfig = new Config.NearCacheConfig();
nearCacheConfig.name = 'mostlyReadMap';
nearCacheConfig.invalidateOnChange = (false|true);
nearCacheConfig.timeToLiveSeconds = (0..Number.MAX_SAFE_INTEGER);
nearCacheConfig.maxIdleSeconds = (0..Number.MAX_SAFE_INTEGER);
nearCacheConfig.inMemoryFormat= (InMemoryFormat.OBJECT|InMemoryFormat.BINARY);
nearCacheConfig.evictionPolicy = (EvictionPolicy.LRU|EvictionPolicy.LFU|EvictionPolicy.RANDOM|EvictionPolicy.NONE);
nearCacheConfig.evictionMaxSize = (0..Number.MAX_SAFE_INTEGER);
nearCacheConfig.evictionSamplingCount = (0..Number.MAX_SAFE_INTEGER);
nearCacheConfig.evictionSamplingPoolSize = (0..Number.MAX_SAFE_INTEGER);

cfg.nearCacheConfigs['mostlyReadMap'] = nearCacheConfig;
```

Following are the descriptions of all configuration elements:

- `inMemoryFormat`: Specifies in which format data will be stored in your Near Cache. Note that a map’s in-memory format can be different from that of its Near Cache. Available values are as follows:
  - `BINARY`: Data will be stored in serialized binary format (default value).
  - `OBJECT`: Data will be stored in deserialized form.

- `invalidateOnChange`: Specifies whether the cached entries are evicted when the entries are updated or removed in members. Its default value is true.

- `timeToLiveSeconds`: Maximum number of seconds for each entry to stay in the Near Cache. Entries that are older than this period are automatically evicted from the Near Cache. Regardless of the eviction policy used, `timeToLiveSeconds` still applies. Any integer between 0 and `Number.MAX_SAFE_INTEGER`. 0 means infinite. Its default value is 0.

- `maxIdleSeconds`: Maximum number of seconds each entry can stay in the Near Cache as untouched (not read). Entries that are not read more than this period are removed from the Near Cache. Any integer between 0 and `Number.MAX_SAFE_INTEGER`. 0 means infinite. Its default value is 0.

- `evictionPolicy`: Eviction policy configuration. Available values are as follows:
  - `LRU`: Least Recently Used (default value).
  - `LFU`: Least Frequently Used.
  - `NONE`: No items are evicted and the `evictionMaxSize` property is ignored. You still can combine it with `timeToLiveSeconds` and `maxIdleSeconds` to evict items from the Near Cache.
  - `RANDOM`: A random item is evicted.

- `evictionMaxSize`: Maximum number of entries kept in the memory before eviction kicks in.
- `evictionSamplingCount`: Number of random entries that are evaluated to see if some of them are already expired. If there are expired entries, those are removed and there is no need for eviction.
- `evictionSamplingPoolSize`: Size of the pool for eviction candidates. The pool is kept sorted according to eviction policy. The entry with the highest score is evicted.

#### 7.8.2.2. Near Cache Example for Map

The following is an example configuration for a Near Cache defined in the `mostlyReadMap` map. According to this configuration, the entries are stored as `OBJECT`'s in this Near Cache and eviction starts when the count of entries reaches `5000`; entries are evicted based on the `LRU` (Least Recently Used) policy. In addition, when an entry is updated or removed on the member side, it is eventually evicted on the client side.

**Declarative Configuration:**

```
{
    "nearCaches": [
        {
            "name": "mostlyReadMap",
            "inMemoryFormat": "object",
            "invalidateOnChange": true,
            "evictionPolicy": "lru",
            "evictionMaxSize": 5000,
        }
    ]
}
```

**Programmatic Configuration:**

```javascript
var nearCacheConfig = new Config.NearCacheConfig();
nearCacheConfig.name = "mostlyReadMap";
nearCacheConfig.inMemoryFormat= InMemoryFormat.OBJECT;
nearCacheConfig.invalidateOnChange = true;
nearCacheConfig.evictionPolicy = EvictionPolicy.LRU;
nearCacheConfig.evictionMaxSize = 5000;

cfg.nearCacheConfigs['mostlyReadMap'] = nearCacheConfig;
```

#### 7.8.2.3. Near Cache Eviction

In the scope of Near Cache, eviction means evicting (clearing) the entries selected according to the given `evictionPolicy` when the specified `evictionMaxSize` has been reached.

The `evictionMaxSize` defines the entry count when the Near Cache is full and determines whether the eviction should be triggered.

Once the eviction is triggered the configured `evictionPolicy` determines which, if any, entries must be evicted.

#### 7.8.2.4. Near Cache Expiration

Expiration means the eviction of expired records. A record is expired:

- if it is not touched (accessed/read) for `maxIdleSeconds`

- `timeToLiveSeconds` passed since it is put to Near Cache

The actual expiration is performed when a record is accessed: it is checked if the record is expired or not. If it is expired, it is evicted and `undefined` is returned as the value to the caller.


#### 7.8.2.5. Near Cache Invalidation

Invalidation is the process of removing an entry from the Near Cache when its value is updated or it is removed from the original map (to prevent stale reads). See the [Near Cache Invalidation section](https://docs.hazelcast.org/docs/latest/manual/html-single/#near-cache-invalidation) in the Hazelcast IMDG Reference Manual.

#### 7.8.2.6. Near Cache Eventual Consistency

Near Caches are invalidated by invalidation events. Invalidation events can be lost due to the fire-and-forget fashion of eventing system. If an event is lost, reads from Near Cache can indefinitely be stale.

To solve this problem, Hazelcast provides eventually consistent behavior for Map Near Caches by detecting invalidation losses. After detection of an invalidation loss, stale data will be made unreachable and Near Cache’s `get` calls to that data will be directed to underlying Map to fetch the fresh data.

You can configure eventual consistency with the `ClientConfig.properties` below:

- `hazelcast.invalidation.max.tolerated.miss.count`: Default value is `10`. If missed invalidation count is bigger than this value, relevant cached data will be made unreachable.

- `hazelcast.invalidation.reconciliation.interval.seconds`: Default value is `60` seconds. This is a periodic task that scans cluster members periodically to compare generated invalidation events with the received ones from the client Near Cache.

## 7.9. Monitoring and Logging

### 7.9.1. Enabling Client Statistics

You can monitor your clients using Hazelcast Management Center.

As a prerequisite, you need to enable the client statistics before starting your clients. This can be done by setting the `hazelcast.client.statistics.enabled` system property to `true` on the **member** as the following:

```xml
<hazelcast>
    ...
    <properties>
        <property name="hazelcast.client.statistics.enabled">true</property>
    </properties>
    ...
</hazelcast>
```

Also, you need to enable the client statistics in the Node.js client. There are two properties related to client statistics:

- `hazelcast.client.statistics.enabled`: If set to `true`, it enables collecting the client statistics and sending them to the cluster. When it is `true` you can monitor the clients that are connected to your Hazelcast cluster, using Hazelcast Management Center. Its default value is `false`.

- `hazelcast.client.statistics.period.seconds`: Period in seconds the client statistics are collected and sent to the cluster. Its default value is `3`.

You can enable client statistics and set a non-default period in seconds as follows:

**Declarative Configuration:**

```json
{
    "properties": {
        "hazelcast.client.statistics.enabled": true,
        "hazelcast.client.statistics.period.seconds": 4,
    }
}
```

**Programmatic Configuration:**

```javascript
var config = new Config.ClientConfig();
config.properties['hazelcast.client.statistics.enabled'] = true;
config.properties['hazelcast.client.statistics.period.seconds'] = 4;
```

After enabling the client statistics, you can monitor your clients using Hazelcast Management Center. Please refer to the [Monitoring Clients section](https://docs.hazelcast.org/docs/management-center/latest/manual/html/index.html#monitoring-clients) in the Hazelcast Management Center Reference Manual for more information on the client statistics.

### 7.9.2. Logging Configuration

 To configure a logger, you need to use the `ClientConfig.properties['hazelcast.logging']` property. If you set it to `'off'`, it does not log anything.

By default, there is a `Default Logger`. Also, it is possible to connect a custom logging library to Hazelcast Node.js client through adapters.

See the following `winston` logging library example.

```javascript
var winstonAdapter = {
    logger: new (winston.Logger)({
        transports: [
            new (winston.transports.Console)()
        ]
    }),

    levels: [
        'error',
        'warn',
        'info',
        'debug',
        'silly'
    ],

    log: function (level, className, message, furtherInfo) {
        this.logger.log(this.levels[level], className + ' ' + message);
    }
};
config.properties['hazelcast.logging'] = winstonAdapter;
```

Note that it is not possible to configure custom logging via declarative configuration.

# 8. Development and Testing

Hazelcast Node.js client is developed using TypeScript. If you want to help with bug fixes, develop new features or
tweak the implementation to your application's needs, you can follow the steps in this section.

## 8.1. Building and Using Client From Sources

Follow the below steps to build and install Hazelcast Node.js client from its source:

1. Clone the GitHub repository (https://github.com/hazelcast/hazelcast-nodejs-client.git).
2. Run `npm install` to automatically download and install all the required modules under `node_modules` directory.
3. Run `npm run compile` to compile TypeScript files to JavaScript.

At this point you have all the runnable code (`.js`) and type declarations (`.d.ts`) in the `lib` directory. You may create a link to this module so that your local
applications can depend on your local copy of Hazelcast Node.js client. In order to create a link, run the below command:

```
npm link
```

This will create a global link to this module in your computer. Whenever you need to depend on this module from another
local project, run the below command:

```
npm link hazelcast-client
```

If you are planning to contribute, please run the style checker, as shown below, and fix the reported issues before sending a pull request:

```
npm run lint
```

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
