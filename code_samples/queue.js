var Client = require('../.').Client;

var insertPerson = function (queue, val) {
    return queue.add(val).then(function(previousVal) {
        console.log('Added value: ' + val + ',  previous value: ' + JSON.stringify(previousVal));
    });
};

var pollPerson = function(queue){
    return queue.poll().then(function(previousVal) {
        console.log('Polled value: ' + JSON.stringify(previousVal));
    });
};

var peekPerson = function(queue){
  return queue.peek().then(function(previousVal){
        console.log('Peeked value: ' + JSON.stringify(previousVal));    
  }); 
};

var shutdownHz = function(client) {
    return client.shutdown();
};

Client.newHazelcastClient().then(function(hazelcastClient){
    var queue = hazelcastClient.getQueue('people');
    var john = 'John';
    var jane = 'Jane';
    var judy = 'Judy';

    //inserts to the back of the queue
    insertPerson(queue,john)
        .then(function (){
            //inserts to the back of the queue
            return insertPerson(queue,jane);
        })
        .then(function (){
            //inserts to the back of the queue
            return insertPerson(queue,judy);
        })
        .then(function (){
            //retrieves and also removes the head of the queue
            return pollPerson(queue);
        })
        .then(function(){
            //retrieves but not remove the head of the queue
            return peekPerson(queue);
        })
        .then(function (){
            return pollPerson(queue);
        })
        .then(function(){
            return peekPerson(queue);
        })
        .then(function(){
            shutdownHz(hazelcastClient)
        })
});



