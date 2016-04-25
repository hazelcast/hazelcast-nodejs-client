var REQ_COUNT = 50000;
var ENTRY_COUNT = 10 * 1000;
var VALUE_SIZE = 10000;
var GET_PERCENTAGE = 40;
var PUT_PERCENTAGE = 40;
var value_string = '';
for (var i = 0; i < VALUE_SIZE; i++) {
    value_string = value_string + 'x';
}
var Test = {
    map: undefined,
    finishCallback: undefined,
    ops: 0,
    increment: function() {
        this.ops = this.ops + 1;
        if (this.ops === REQ_COUNT) {
            var date = new Date();
            this.run = function() {};
            this.finishCallback(date);
        }
    },
    run: function() {
        var key = Math.random() * ENTRY_COUNT;
        var opType = Math.floor(Math.random() * 100);
        if (opType < GET_PERCENTAGE ) {
            this.map.get(key).
                then(this.increment.bind(this));
        } else if (opType < GET_PERCENTAGE + PUT_PERCENTAGE) {
            this.map.put(key, value_string).
                then(this.increment.bind(this));
        } else {
            this.map.remove(key)
                .then(this.increment.bind(this));
        }
        setImmediate(this.run.bind(this));
    }
};
var Client = require('../.').Client;
Client.newHazelcastClient().then(function(hazelcastClient) {
    Test.map = hazelcastClient.getMap('default');
    var start;
    Test.finishCallback = function(finish) {
        console.log('Took ' + (finish - start)/1000 + ' seconds for ' + REQ_COUNT + ' requests');
        console.log('Ops/s: ' + REQ_COUNT / ((finish - start) / 1000));
        hazelcastClient.shutdown();
    };
    start = new Date();
    Test.run();
});
