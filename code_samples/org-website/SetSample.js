var Client = require('hazelcast-client').Client;
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient().then(function (hz) {
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
    }).then(function () {
        // Shutdown this Hazelcast client
        hz.shutdown();
    });
});
