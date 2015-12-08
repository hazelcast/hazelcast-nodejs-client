var operations = require("./layouts").operations;

var AtomicLong = function (client, name) {
    this.client = client;
    this.name = name;
};


AtomicLong.prototype.addAndGet = function (delta) {
    return this.client.invokeOperation(operations.ATOMIC_LONG.ADD_AND_GET, {
        "name": this.name,
        "delta": delta
    });
};

AtomicLong.prototype.compareAndSet = function (expected, newValue) {
    return this.client.invokeOperation(operations.ATOMIC_LONG.COMPARE_AND_SET, {
        "name": this.name,
        "expected": expected,
        "newValue": newValue
    });
};

AtomicLong.prototype.decrementAndGet = function () {
    return this.client.invokeOperation(operations.ATOMIC_LONG.DECREMENT_AND_GET, {
        "name": this.name
    });
};

AtomicLong.prototype.get = function () {
    return this.client.invokeOperation(operations.ATOMIC_LONG.GET, {
        "name": this.name
    });
};

AtomicLong.prototype.getAndAdd = function (delta) {
    return this.client.invokeOperation(operations.ATOMIC_LONG.GET_AND_ADD, {
        "name": this.name,
        "delta": delta
    });
};

AtomicLong.prototype.getAndSet = function (newValue) {
    return this.client.invokeOperation(operations.ATOMIC_LONG.GET_AND_SET, {
        "name": this.name,
        "newValue": newValue
    });
};

AtomicLong.prototype.incrementAndGet = function () {
    return this.client.invokeOperation(operations.ATOMIC_LONG.INCREMENT_AND_GET, {
        "name": this.name
    });
};

AtomicLong.prototype.getAndIncrement = function () {
    return this.client.invokeOperation(operations.ATOMIC_LONG.GET_AND_INCREMENT, {
        "name": this.name
    });
};

AtomicLong.prototype.set = function (newValue) {
    return this.client.invokeOperation(operations.ATOMIC_LONG.SET, {
        "name": this.name,
        "newValue": newValue
    });
};

module.exports = AtomicLong;