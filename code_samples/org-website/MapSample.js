var Client = require('hazelcast-client').Client;
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient().then(function (hz) {
    var map;
    // Get the Distributed Map from Cluster.
    hz.getMap('my-distributed-map').then(function (mp) {
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
    }).then(function (value) {
        // Shutdown this Hazelcast client
        hz.shutdown();
    });
});
