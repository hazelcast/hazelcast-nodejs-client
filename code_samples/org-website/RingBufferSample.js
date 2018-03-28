var Client = require('hazelcast-client').Client;
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient().then(function (hz) {
    var rb = hz.getRingbuffer('rb');
    return rb.add(100).then(function () {
        return rb.add(200);
    }).then(function (value) {
        // we start from the oldest item.
        // if you want to start from the next item, call rb.tailSequence()+1
        return rb.headSequence();
    }).then(function (sequence) {
        return rb.readOne(sequence).then(function (value) {
            console.log(value);
            return rb.readOne(sequence.add(1));
        }).then(function (value) {
            console.log(value);
            // Shutdown this Hazelcast Client
            hz.shutdown();
        });
    });
});
