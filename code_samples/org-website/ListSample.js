var Client = require('hazelcast-client').Client;
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient().then(function (hz) {
    // Get the Distributed List from Cluster.
    var list = hz.getList('my-distributed-list');
    // Add elements to the list
    return list.add('item1').then(function () {
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
    }).then(function () {
        // Shutdown this Hazelcast client
        hz.shutdown();
    });
});
