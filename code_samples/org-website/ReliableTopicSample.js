var Client = require('hazelcast-client').Client;
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient().then(function (hz) {
    // Get a Topic called "my-distributed-topic"
    var topic = hz.getReliableTopic("my-distributed-topic");
    // Add a Listener to the Topic
    topic.addMessageListener(function (message) {
        console.log(message);
        // Shutdown this Hazelcast Client
        hz.shutdown();
    });
    // Publish a message to the Topic
    topic.publish('Hello to distributed world');
});
