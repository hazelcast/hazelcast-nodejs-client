/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {Data} from '../serialization/Data';
import {EntryView} from '../core/EntryView';

export class EntryViewCodec {
    static encode(clientMessage: ClientMessage, entryView: EntryView<any, any>, toData: (object: any) => Data = null) {
        clientMessage.appendData(toData(entryView.key));
        clientMessage.appendData(toData(entryView.value));
        clientMessage.appendLong(entryView.cost);
        clientMessage.appendLong(entryView.creationTime);
        clientMessage.appendLong(entryView.expirationTime);
        clientMessage.appendLong(entryView.hits);
        clientMessage.appendLong(entryView.lastAccessTime);
        clientMessage.appendLong(entryView.lastStoreTime);
        clientMessage.appendLong(entryView.lastUpdateTime);
        clientMessage.appendLong(entryView.version);
        clientMessage.appendLong(entryView.evictionCriteriaNumber);
        clientMessage.appendLong(entryView.ttl);
    }

    static decode(clientMessage:ClientMessage, toObject: (data:Data) => any = null) {
        var entry = new EntryView<any, any>();
        entry.key = toObject(clientMessage.readData());
        entry.value = toObject(clientMessage.readData());
        entry.cost = clientMessage.readLong();
        entry.creationTime = clientMessage.readLong();
        entry.expirationTime = clientMessage.readLong();
        entry.hits = clientMessage.readLong();
        entry.lastAccessTime = clientMessage.readLong();
        entry.lastStoreTime = clientMessage.readLong();
        entry.lastUpdateTime = clientMessage.readLong();
        entry.version = clientMessage.readLong();
        entry.evictionCriteriaNumber = clientMessage.readLong();
        entry.ttl = clientMessage.readLong();
        return entry;
    }
}
