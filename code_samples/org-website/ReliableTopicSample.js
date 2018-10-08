var Client = require('hazelcast-client').Client;
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient().then(function (hz) {
    var topic;
    // Get a Topic called "my-distributed-topic"
    hz.getReliableTopic("my-distributed-topic").then(function (t) {
        topic = t;
        // Add a Listener to the Topic
        topic.addMessageListener(function (message) {
            console.log(message);
        });
        // Publish a message to the Topic
        return topic.publish('Hello to distributed world');
    }).then(function () {
        // Shutdown this Hazelcast Client
        hz.shutdown();
    });

});
