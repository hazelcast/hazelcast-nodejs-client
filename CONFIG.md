You can configure Hazelcast Node.js Client declaratively (JSON) or programmatically (API).

* Programmatic configuration
* Declarative configuration (JSON file)

# Programmatic Configuration
For programmatic configuration of the Hazelcast Java Client, just instantiate a ClientConfig object and configure the
desired aspects. An example is shown below.

```javascript
var Config = require('hazelcast-client').Config;
var Address = require('hazelcast-client').Address;
var cfg = new Config.ClientConfig();
cfg.networkConfig.addresses.push('127.0.0.1:5701');
return HazelcastClient.newHazelcastClient(cfg);
```

Refer to [Hazelcast Node.js Client API Docs](http://hazelcast.github.io/hazelcast-nodejs-client/api/current/docs) for details.

# Declarative Configuration (JSON)
For declarative configuration, the Hazelcast client looks at the following places for the client configuration file.

1. Environment variable: The client first looks for the environment variable `HAZELCAST_CLIENT_CONFIG`. If it exists,
the client looks for the configuration file in the specified location.
2. Current working directory: If there is no environment variable set, the client tries to load `hazelcast-client.json`
from the current working directory.
3. Default configuration: If all of the above methods fail, the client starts with the default configuration.

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

## Group Configuration

The clients should provide a group name and password in order to connect to the cluster.
You can configure them as shown below.

```json
{
    "group": {
        "name": "hazel",
        "password": "cast"
    }
}
```

## Client Network

All network related configuration of Hazelcast Node.js Client is performed via the `network` element in the declarative
configuration file. Let's first give an example for `network` configuration. Then we will look at its properties.

```json
{
    "network": {
        "clusterMembers": [
            "127.0.0.9",
            "127.0.0.2:5702"
        ],
        "smartRouting": false,
        "connectionTimeout": 6000,
        "connectionAttemptPeriod": 4000,
        "connectionAttemptLimit": 3,
        "ssl": {
            "enabled": true,
            "factory": {
                "path": "path/to/file",
                "exportedName": "exportedName",
                "properties": {
                    "userDefinedProperty1": "userDefinedValue"
                }
            }
        }
    }
}
```

### Configuring Address List

Address list is the initial list of cluster addresses to which the client will connect. The client uses this
list to find an alive member. Although it may be enough to give only one address of a member in the cluster
(since all members communicate with each other), it is recommended that you give the addresses for all the members.

```json
{
    "network": {
        "clusterMembers": [
            "127.0.0.9",
            "127.0.0.2:5702"
        ]
    }
}
```
If the port part is omitted, then 5701, 5702, and 5703 will be tried in random order.

Default address is 127.0.0.1.

### Setting Smart Routing

Smart routing defines whether the client mode is smart or unisocket. The following is an example configuration.

```json
{
    "network": {
        "smartRouting": true
    }
}
```

Default is smart routing mode.

### Setting Connection Timeout

Connection timeout is the timeout value in milliseconds for the members to accept client connection requests.
```json
{
    "network": {
        "connectionTimeout": 6000
    }
}
```
Default value is 5000 milliseconds.

### Setting Connection Attempt Limit

While the client is trying to connect initially to one of the members in the  address list, that member
might not be available at that moment. Instead of giving up, throwing an error and stopping the client,
the client will retry as many as connection attempt limit times. This is also the case when the previously
established connection between the client and that member goes down.

```json
{
    "network": {
        "connectionAttemptLimit": 3
    }
}
```
Default value is 2.

### Setting Connection Attempt Period

Connection timeout period is the duration in milliseconds between the connection attempts defined by
connection attempt limit.

```json
{
    "network": {
        "connectionAttemptPeriod": 4000
    }
}
```

Default value is 3000.

### Enabling Client TLS/SSL

You can use TLS/SSL to secure the connection between the client and members. If you want TLS/SSL enabled
for the client-cluster connection, you should set an SSL configuration. Once set, the connection (socket) is
established out of an `options` object supplied by the user.

Hazelcast Node.js Client uses a user supplied SSL `options` object to pass to
[`tls.connect` of Node.js](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback). There are two ways
to provide this object to the client:

1. Using the built-in `BasicSSLOptionsFactory` bundled with the client.
2. Writing an SSLOptionsFactory.

Below subsections describe each way.

#### Using Built-in BasicSSLOptionsFactory

Hazelcast Node.js Client includes a utility factory class that creates the necessary `options` object out of the supplied
properties. All you need to do is specifying your factory as `BasicSSLOptionsFactory` and provide the following options:

    caPath
    keyPath
    certPath
    servername
    rejectUnauthorized
    ciphers

Please refer to [`tls.connect` of Node.js](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback) for the descriptions of each option.

> `certPath` and `caPath` define file path to respective file that stores such information.

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

#### Writing an SSL Options Factory

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

For information about the path resolution, please refer to the [Path Resolution](#path-resolution-and-object-loading) section.

### Enabling Hazelcast Cloud Discovery
The purpose of Hazelcast Cloud Discovery is to provide clients to use IP addresses provided by `hazelcast orchestrator`. To enable Hazelcast Cloud Discovery, specify a token for the `discoveryToken` field and set the `enabled` field to "true".

Hazelcast Cloud configuration is as follows:

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

To be able to connect to the provided IP addresses, you should use secure TLS/SSL connection between the client and members. Therefore, you should set an SSL configuration as described in the previous section.

## Serialization Configuration

This section shows how to configure Hazelcast serialization declaratively. Please refer to [Hazelcast IMDG Reference Manual](http://docs.hazelcast.org/docs/latest/manual/html-single/index.html#serialization)
and [Node.js client readme](https://github.com/hazelcast/hazelcast-nodejs-client/#serialization-considerations) for more information on serializations.

Serialization configuration is as follows:

```json
{
"serialization": {
        "defaultNumberType": "integer",
        "isBigEndian": false,
        "dataSerializableFactories": [
            {
                "path": "path/to/file",
                "exportedName": "exportedName",
                "factoryId": 0
            }
        ],
        "portableFactories": [
            {
                "path": "path/to/file",
                "exportedName": "exportedName",
                "factoryId": 1
            }
        ],
        "portableVersion": 1,
        "globalSerializer": {
            "path": "path/to/file",
            "exportedName": "exportedName"
        },
        "serializers": [
            {
                "path": "path/to/custom",
                "exportedName": "CustomSerializer1",
                "typeId": 2
            },
            {
                "path": "path/to/custom",
                "exportedName": "CustomSerializer2",
                "typeId": 3
            }
        ]
    }
}
```

One important aspect of Node.js Client's serialization is `defaultNumberType`. Hazelcast servers use 4 different
primitive numeric types; `int`, `long`, `float` and `double`. However, Javascript has only one numeric type which
is `number`. Number is a floating point type. If you do not work with heterogenous clients (multiple languages),
you do not need to worry about this setting. However, if your numeric data is accessed by the clients in different
languages, you need to map `number` type to one of the numeric types recognized by the Java servers. Hazelcast handles
type conversions automatically. Accepted values for `defaultNumberType` are `integer`, `float` and `double`. You
may use `long` module for working with longs. [long module](https://www.npmjs.com/package/long) is included
in Hazelcast Node.js Client.

Related section: [Path Resolution](#path-resolution-and-object-loading)

## Configuring Near Cache

You may configure Near Caches for your maps as the following:

```json
{
    "nearCaches": [
        {
            "name": "nc-map",
            "invalidateOnChange": false,
            "maxIdleSeconds": 2,
            "inMemoryFormat": "object",
            "timeToLiveSeconds": 3,
            "evictionPolicy": "lru",
            "evictionMaxSize": 3000,
            "evictionSamplingCount": 4,
            "evictionSamplingPoolSize": 8
        }
    ]
}
```
`nearCaches` is an array that includes one configuration object for each Near Cache in the client. For meanings
of configuration options, please refer to [NearCacheConfig API Documentation](http://hazelcast.github.io/hazelcast-nodejs-client/api/0.7/docs/classes/_config_.nearcacheconfig.html).

## Configuring Flake Id Generator
You may configure flake id generators as the following:

```json
{
    "flakeIdGeneratorConfigs": [
        {
            "name": "flakeidgenerator",
            "prefetchCount": 123,
            "prefetchValidityMillis": 150000
        }
    ]
}
```
For meanings of configuration options refer to FlakeIdGenerator's API documantation [API Documentation](http://hazelcast.github.io/hazelcast-nodejs-client/api/current/docs)

> Note: Since Javascript cannot represent numbers greater than 2^53, you need to put long numbers in quotes as a string.

## Composing Declarative Configuration

You can compose the declarative configuration of your Hazelcast client from multiple declarative
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

To get your example Hazelcast declarative configuration out of the above two, use the `import` element as
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


## Path Resolution and Object Loading

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
