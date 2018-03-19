var Client = require('hazelcast-client').Client;
Client.newHazelcastClient().then(function (hz) {
    var rb = hz.getRingbuffer('rb');

    addToRingBuffer(rb, 1);
});

function addToRingBuffer(rb, item) {
    rb.add(item).then(function () {
        console.log('Written ' + item);
        setTimeout(function () {
            addToRingBuffer(rb, item+1);
        }, 1000);
    });
}
