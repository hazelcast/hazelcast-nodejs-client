<p align="center">
    <a href="https://github.com/hazelcast/hazelcast-nodejs-client/">
        <img src="https://docs.hazelcast.com/_/img/hazelcast-logo.svg" />
    </a>
    <h2 align="center">Hazelcast Node.js Client</h2>
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/hazelcast-client">
        <img src="https://img.shields.io/npm/v/hazelcast-client" alt="NPM version">
    </a>
    <a href="https://slack.hazelcast.com">
        <img src="https://img.shields.io/badge/slack-chat-green.svg" alt="Chat on Slack">
    </a>
    <a href="https://twitter.com/Hazelcast">
        <!-- markdownlint-disable-next-line MD013 -->
        <img src="https://img.shields.io/twitter/follow/Hazelcast.svg?style=flat-square&colorA=1da1f2&colorB=&label=Follow%20on%20Twitter" alt="Follow on Twitter">
    </a>
</p>

---

## What is Hazelcast?

[Hazelcast](https://hazelcast.com/) is a distributed computation and storage platform for consistently low-latency querying,
aggregation and stateful computation against event streams and traditional data sources. It allows you to quickly build
resource-efficient, real-time applications. You can deploy it at any scale from small edge devices to a large cluster of
cloud instances.

A cluster of Hazelcast nodes share both the data storage and computational load which can dynamically scale up and down.
When you add new nodes to the cluster, the data is automatically rebalanced across the cluster, and currently running
computational tasks (known as jobs) snapshot their state and scale with processing guarantees.

For more info, check out Hazelcast [repository](https://github.com/hazelcast/hazelcast).

## What is Hazelcast Node.js Client?

Hazelcast Node.js client is a way to communicate to Hazelcast clusters and access the cluster data via Node.js.
The client provides a Promise-based API with a builtin support for native JavaScript objects.

For a list of the features available, and for information about how to install and get started with the client,
see the [Node.js client documentation](https://docs.hazelcast.com/hazelcast/latest/clients/nodejs).

## Contributing

We encourage any type of contribution in the form of issue reports or pull requests.

### Issue Reports

For issue reports, please share the following information with us to quickly resolve the problems.

* Hazelcast and the client version that you use
* General information about the environment and the architecture you use like Node.js version, cluster size,
number of clients, Java version, JVM parameters, operating system etc.
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
5. To have a consistent code style across the code base, Hazelcast Node.js client uses a style checker.
Run `npm run lint` and fix the reported issues, if any.

#### Testing

In order to test Hazelcast Node.js client locally, you will need the following:

* Java 8 or newer
* Maven

Following command starts the tests:

```bash
npm test
```

Test script automatically downloads `hazelcast-remote-controller` and Hazelcast. The script uses Maven to download those.

In order to run specific tests, you can give a pattern to the test command like the following:

```bash
npm test pattern
```

This command will only run the tests matching the pattern. The pattern can be a string or regex in the same form
`grep` command accepts.

## License

[Apache 2.0 License](LICENSE).

## Copyright

Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.

Visit [www.hazelcast.com](http://www.hazelcast.com) for more information.
