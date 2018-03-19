var Client = require('hazelcast-client').Client;
Client.newHazelcastClient().then(function (hz) {
    var rb = hz.getRingbuffer('rb');
    // we start from the oldest item.
    // if you want to start from the next item, call rb.tailSequence()+1
    return rb.headSequence().then(function (sequence) {
        console.log('Start reading from: ' + sequence);
        readFromRingBuffer(rb, sequence);
    });
});

function readFromRingBuffer(rb, sequence) {
    rb.readOne(sequence).then(function (item) {
        console.log('Read: ' + item);
        setTimeout(readFromRingBuffer(rb, sequence.add(1)), 0);
    })
}
