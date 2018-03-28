var Client = require('hazelcast-client').Client;
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient().then(function (hz) {
    // Get a distributed lock called "my-distributed-lock"
    var lock = hz.getLock("my-distributed-lock");
    // Now create a lock and execute some guarded code.
    return lock.lock().then(function () {
        //do something here
    }).finally(function () {
        return lock.unlock();
    }).then(function () {
        // Shutdown this Hazelcast Client
        hz.shutdown();
    });
});
