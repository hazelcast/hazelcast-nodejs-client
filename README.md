<p align="center">
    <a href="https://github.com/hazelcast/hazelcast-nodejs-client/">
        <img src="https://3l0wd94f0qdd10om8642z9se-wpengine.netdna-ssl.com/images/logos/hazelcast-logo-horz_md.png" />
    </a>
    <h2 align="center">Hazelcast Node.js Client</h2>
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/hazelcast-client"><img src="https://img.shields.io/npm/v/hazelcast-client" alt="NPM version"></a>
    <a href="https://slack.hazelcast.com"><img src="https://img.shields.io/badge/slack-chat-green.svg" alt="Chat on Slack"></a>
    <a href="https://twitter.com/Hazelcast"><img src="https://img.shields.io/twitter/follow/Hazelcast.svg?style=flat-square&colorA=1da1f2&colorB=&label=Follow%20on%20Twitter" alt="Follow on Twitter"></a>
</p>

---

[Hazelcast](https://hazelcast.org/) is an open-source distributed in-memory data store and computation platform that
provides a wide variety of distributed data structures and concurrency primitives.

Hazelcast Node.js client is a way to communicate to Hazelcast IMDG clusters and access the cluster data.
The client provides a Promise-based API with a builtin support for native JavaScript objects.

## Installation

### Hazelcast

Hazelcast Node.js client requires a working Hazelcast IMDG cluster to run. This cluster handles the storage and
manipulation of the user data.

A Hazelcast IMDG cluster consists of one or more cluster members. These members generally run on multiple virtual or
physical machines and are connected to each other via the network. Any data put on the cluster is partitioned to
multiple members transparent to the user. It is therefore very easy to scale the system by adding new members as
the data grows. Hazelcast IMDG cluster also offers resilience. Should any hardware or software problem causes a crash
to any member, the data on that member is recovered from backups and the cluster continues to operate without any
downtime.

The quickest way to start a single member cluster for development purposes is to use our
[Docker images](https://hub.docker.com/r/hazelcast/hazelcast/).

```bash
docker run -p 5701:5701 hazelcast/hazelcast:4.1.1
```

You can also use our ZIP or TAR [distributions](https://hazelcast.org/imdg/download/archives/#hazelcast-imdg)
as described [here](DOCUMENTATION.md#121-setting-up-a-hazelcast-imdg-cluster).

### Client

```bash
npm install hazelcast-client
```

## Overview

### Usage

```js
const { Client } = require('hazelcast-client');

// Connect to Hazelcast cluster
const client = await Client.newHazelcastClient();

// Get or create the 'distributed-map' on the cluster
const map = await client.getMap('distributed-map');

// Put 'key', 'value' pair into the 'distributed-map'
await map.put('key', 'value');

// Get the value associated with the given key from the cluster
const value = await map.get('key');
console.log(value); // Outputs 'value'

// Shutdown the client
await client.shutdown();
```

> **NOTE: For the sake of brevity we are going to omit boilerplate parts in the above code snippet. Refer to the [Code Samples section](https://github.com/hazelcast/hazelcast-nodejs-client/tree/master/code_samples) to see samples with the complete code.**

If you are using Hazelcast IMDG and the Node.js client on the same machine, the default configuration should work
out-of-the-box. However, you may need to configure the client to connect to cluster nodes that are running on
different machines or to customize client properties.

### Configuration

```js
const { Client } = require('hazelcast-client');

// Initialize the client with the given configuration
const client = await Client.newHazelcastClient({
    clusterName: 'cluster-name',
    network: {
        clusterMembers: [
            '10.90.0.2:5701',
            '10.90.0.3:5701'
        ]
    },
    lifecycleListeners: [
        (state) => {
            console.log('Lifecycle Event >>> ' + state);
        }
    ]
});

console.log('Connected to cluster');
await client.shutdown();
```

Refer to [the documentation](DOCUMENTATION.md) to learn more about supported configuration options.

## Features

* Distributed, partitioned and queryable in-memory key-value store implementation, called **Map**
* Eventually consistent cache implementation to store a subset of the Map data locally in the memory of the client, called **Near Cache**
* Additional data structures and simple messaging constructs such as **Set**, **MultiMap**, **Queue**, **Topic**
* Cluster-wide unique ID generator, called **FlakeIdGenerator**
* Distributed, CRDT based counter, called **PNCounter**
* Distributed concurrency primitives from CP Subsystem such as **FencedLock**, **Semaphore**, **AtomicLong**
* Integration with [Hazelcast Cloud](https://cloud.hazelcast.com/)
* Support for serverless and traditional web service architectures with **Unisocket** and **Smart** operation modes
* Ability to listen client lifecycle, cluster state and distributed data structure events
* and [many more](https://hazelcast.org/imdg/clients-languages/node-js/#client-features).

## Getting Help

You can use the following channels for your questions and development/usage issues:

* [GitHub repository](https://github.com/hazelcast/hazelcast-nodejs-client)
* [Complete documentation](DOCUMENTATION.md)
* [API documentation](http://hazelcast.github.io/hazelcast-nodejs-client/api/current/docs/)
* [Slack](https://slack.hazelcast.com)
* [Google Groups](https://groups.google.com/forum/#!forum/hazelcast)
* [Stack Overflow](https://stackoverflow.com/questions/tagged/hazelcast)

## Contributing

We encourage any type of contribution in the form of issue reports or pull requests.

### Issue Reports

For issue reports, please share the following information with us to quickly resolve the problems.

* Hazelcast IMDG and the client version that you use
* General information about the environment and the architecture you use like Node.js version, cluster size, number of clients, Java version, JVM parameters, operating system etc.
* Logs and stack traces, if any.
* Detailed description of the steps to reproduce the issue.

### Pull Requests

Contributions are submitted, reviewed and accepted using the pull requests on GitHub. For an enhancement or larger
feature, create a GitHub issue first to discuss.

#### Development

1. Clone the GitHub [repository](https://github.com/hazelcast/hazelcast-nodejs-client.git).
2. Run `npm install` to automatically download and install all the required modules.
3. Do the work.
4. Hazelcast Node.js client developed using TypeScript. Run `npm run compile` to compile TypeScript files to JavaScript.
5. To have a consistent code style across the code base, Hazelcast Node.js client uses a style checker. Run `npm run lint` and fix the reported issues, if any.

#### Testing

In order to test Hazelcast Node.js client locally, you will need the following:

* Java 8 or newer
* Maven

Following command starts the tests:

```bash
npm test
```

Test script automatically downloads `hazelcast-remote-controller` and Hazelcast IMDG. The script uses Maven to download those.

## License

[Apache 2.0 License](LICENSE).

## Copyright

Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.

Visit [www.hazelcast.com](http://www.hazelcast.com) for more information.
