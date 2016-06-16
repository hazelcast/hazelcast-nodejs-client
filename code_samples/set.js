var Client = require('../.').Client;

var insertPerson = function(myset, val){
    return myset.add(val).then(function(previousVal){
       console.log('Added value: ' + JSON.stringify(val) + ' Insert operation: ' +JSON.stringify(previousVal));
    });
};

var removePerson = function(myset,val){
    return myset.remove(val).then(function(previousVal) {
        console.log('Removed value: ' + JSON.stringify(val));
    });
};


var containPerson = function(myset, val){
    return myset.contains(val).then(function(previousVal){
        if(previousVal === true) 
            console.log("Set contains the value " + JSON.stringify(val)) ;
        else
            console.log("Set does not contain the value " + JSON.stringify(val));
    });
};

var totalPeople = function(myset){
    return myset.size().then(function(previousVal){
       console.log("Set consists of " + JSON.stringify(previousVal) + " elements"); 
    });
}

var shutdownHz = function(client) {
    return client.shutdown();
};


Client.newHazelcastClient().then(function (hazelcastClient) {
    var set = hazelcastClient.getSet('people');
    var john = 'John';
    var jane = 'Jane';
    var anotherjohn = 'John';

    //insert an element
    insertPerson(set, john)
        .then(function () {
            //inserts a different element
            return insertPerson(set, jane);
        })
        .then(function () {
            //trying to insert an element which has been already added to the set and so failing to add
            return insertPerson(set, anotherjohn);
        })
        .then(function () {
            //check if an element is in the set or not
            return containPerson(set, 'John');
        })
        .then(function () {
            //check if an element is in the set or not
            return containPerson(set, 'Jack');
        })
        .then(function () {
            //total number of elements in the set
            return totalPeople(set);
        })
        .then(function () {
            //removes the given value in the set
            return removePerson(set,'John');
        })
        .then(function () {
            //Because the element was removed, now we can add this element to the set back
            return insertPerson(set,'John');
        })
        .then(function () {
            shutdownHz(hazelcastClient);
        })
});
