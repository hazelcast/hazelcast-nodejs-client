var Client = require('hazelcast-client').Client;
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient().then(function (hz) {
    // Get a Blocking Queue called "my-distributed-queue"
    var queue = hz.getQueue('my-distributed-queue');
    // Offer a String into the Distributed Queue
    return queue.offer('item').then(function () {
        // Poll the Distributed Queue and return the String
        return queue.poll();
    }).then(function () {
        //Timed blocking Operations
        return queue.offer('anotheritem', 500);
    }).then(function () {
        return queue.poll(5000);
    }).then(function () {
        //Indefinitely blocking Operations
        return queue.put('yetanotheritem');
    }).then(function () {
        return queue.take();
    }).then(function () {
        // Shutdown the Hazelcast Cluster Member
        hz.shutdown();
    })
});
