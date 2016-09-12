import Address = require('../../Address');
import Long = require('long');

export class TopicMessage<T> {
    messageObject: T;
    publisher: Address;
    publishingTime: Long;
}
