var Client = require('hazelcast-client').Client;
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient().then(function (hz) {
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
        // Shutdown this Hazelcast Client
        hz.shutdown();
    });
});
