var Client = require('hazelcast-client').Client;
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient().then(function (hz) {
    // Get a Replicated Map called "my-replicated-map"
    var map = hz.getReplicatedMap('my-replicated-map');
    // Put and Get a value from the Replicated Map
    // key/value replicated to all members
    return map.put('key', 'value').then(function (replacedValue) {
        console.log('replaced value = ' + replacedValue); // Will be null as its first update
        return map.get('key');
    }).then(function (value) {
        // the value is retrieved from a random member in the cluster
        console.log('value for key = ' + value);
        // Shutdown this Hazelcast Client
        hz.shutdown();
    });
});
