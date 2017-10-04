var expect = require("chai").expect;
var index = require("../../lib/index.js");

var HazelcastClient = index.Client;
var Config = index.Config;
var TopicOverloadPolicy = index.TopicOverloadPolicy.TopicOverloadPolicy;
var Controller = require('./../RC');
var RawTopicMessage = require('../../lib/proxy/topic/RawTopicMessage').RawTopicMessage;
var fs = require('fs');
var Long = require('long');

var Promise = require('bluebird');

var createConfig = function () {
    var config = new Config.ClientConfig();

    var discard = new Config.ReliableTopicConfig();
    discard.overloadPolicy = TopicOverloadPolicy.DISCARD_NEWEST;

    var overwrite = new Config.ReliableTopicConfig();
    overwrite.overloadPolicy = TopicOverloadPolicy.DISCARD_OLDEST;

    config.reliableTopicConfigs["discard"] = discard;
    config.reliableTopicConfigs["overwrite"] = overwrite;
    return config;
};

var generateItems = function (client, howMany) {
    var all = [];

    for (var i = 1; i <= howMany; i++) {
        var reliableTopicMessage = new RawTopicMessage();
        reliableTopicMessage.payload = client.getSerializationService().toData(i);
        reliableTopicMessage.publishTime = Long.fromNumber(new Date().getTime());
        reliableTopicMessage.publisherAddress = client.getClusterService().getClientInfo().localAddress;
        all.push(reliableTopicMessage);
    }
    return all;
};
describe("Reliable Topic Proxy", function () {

    var cluster;
    var clientOne;
    var clientTwo;

    this.timeout(5000);

    before(function () {
        this.timeout(10000);
        var config = fs.readFileSync(__dirname + '/hazelcast_topic.xml', 'utf8');
        return Controller.createCluster(null, config).then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        }).then(function () {

            var config = createConfig();

            return Promise.all([
                HazelcastClient.newHazelcastClient(config).then(function (hazelcastClient) {
                    clientOne = hazelcastClient;
                }),
                HazelcastClient.newHazelcastClient(config).then(function (hazelcastClient) {
                    clientTwo = hazelcastClient;
                })
            ]);
        });
    });


    after(function () {
        clientOne.shutdown();
        clientTwo.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    it("writes and reads messages", function (done) {
        var topicOne = clientOne.getReliableTopic("t");
        var topicTwo = clientTwo.getReliableTopic("t");

        topicTwo.addMessageListener(function (msg) {
            if (msg.messageObject["value"] === "foo") {
                done();
            }
        });

        setTimeout(function () {
            topicOne.publish({"value": "foo"});
        }, 500);
    });

    it('removed message listener does not receive items after removal', function (done) {
        var topicOne = clientOne.getReliableTopic("t");
        var topicTwo = clientTwo.getReliableTopic("t");

        var receivedMessages = 0;

        var id = topicTwo.addMessageListener(function (msg) {
            receivedMessages++;
            if (receivedMessages > 2) {
                done(new Error('Keep receiving messages after removal.'));
            }
        });

        topicOne.publish({"value0": "foo0"});
        topicOne.publish({"value1": "foo1"});
        setTimeout(function () {
            topicTwo.removeMessageListener(id);
            topicOne.publish({"value2": "foo2"});
            topicOne.publish({"value3": "foo3"});
            topicOne.publish({"value4": "foo4"});
            topicOne.publish({"value5": "foo5"});
            setTimeout(done, 500);
        }, 500);
    });

    it("blocks when there is no more space", function (done) {
        var topic = clientOne.getReliableTopic("blocking");
        var ringbuffer = topic.getRingbuffer();

        ringbuffer.capacity().then(function (capacity) {
            var all = [];

            for (var i = 0; i < capacity.toNumber() + 1; i++) {
                all.push(i);
            }

            return ringbuffer.addAll(all);
        }).then(function () {
            var startTime = new Date().getTime();
            topic.publish(-50).then(function () {
                /*
                 Here we check that the call was indeed blocking
                 until the TTL of the first inserted entry has passed
                 */

                var elapsed = new Date().getTime() - startTime;

                if (elapsed > 2000) {
                    done();
                } else {
                    done(new Error("Message was published too fast, expected at least a 2 second delay, got: " + elapsed));
                }
            });
        });

    });

    it("continues operating when stale sequence is reached", function (done) {
        var topic = clientOne.getReliableTopic("stale");
        var ringbuffer = topic.getRingbuffer();

        topic.addMessageListener(function (e) {
            if (e.messageObject === 20) {
                done();
            }
        });

        var all = generateItems(clientOne, 20);


        ringbuffer.addAll(all);
    });

    it("discards the item when there is no more space", function () {
        var topic = clientOne.getReliableTopic("discard");
        var ringbuffer = topic.getRingbuffer();

        var all = generateItems(clientOne, 10);

        ringbuffer.addAll(all);

        return topic.publish(11).then(function () {
            return ringbuffer.tailSequence();
        }).then(function (seq) {
            return ringbuffer.readOne(seq);
        }).then(function (item) {
            var obj = clientOne.getSerializationService().toObject(item.payload);
            expect(obj).to.equal(10);
        });
    });


    it("overwrites the oldest item when there is no more space", function () {
        var topic = clientOne.getReliableTopic("overwrite");
        var ringbuffer = topic.getRingbuffer();

        var all = generateItems(clientOne, 10);

        ringbuffer.addAll(all);

        return topic.publish(11).then(function () {
            return ringbuffer.tailSequence();
        }).then(function (seq) {
            return ringbuffer.readOne(seq);
        }).then(function (item) {
            var obj = clientOne.getSerializationService().toObject(item.payload);
            expect(obj).to.equal(11);
        });
    })

});
