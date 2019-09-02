import {ClientMessage, Frame} from "../ClientMessage";
import {Buffer} from 'safe-buffer';
import {FixedSizeTypes} from "./FixedSizeTypes";
// @ts-ignore
import * as Long from "long";
import {EntryView} from "/Users/gulcesirvanci/Desktop/hazelcast-nodejs-client/src/core/EntryView";
import {CodecUtil} from "./CodecUtil";
import {BitsUtil} from "../BitsUtil";
import {Data} from "/Users/gulcesirvanci/Desktop/hazelcast-nodejs-client/lib/serialization/Data";
import {DataCodec} from "./DataCodec";


export class SimpleEntryViewCodec {

    private static COST_OFFSET = 0;
    private static CREATION_TIME_OFFSET = SimpleEntryViewCodec.COST_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
    private static EXPIRATION_TIME_OFFSET = SimpleEntryViewCodec.CREATION_TIME_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
    private static HITS_OFFSET = SimpleEntryViewCodec.EXPIRATION_TIME_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
    private static LAST_ACCESS_TIME_OFFSET = SimpleEntryViewCodec.HITS_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
    private static LAST_STORED_TIME_OFFSET = SimpleEntryViewCodec.LAST_ACCESS_TIME_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
    private static LAST_UPDATE_TIME_OFFSET = SimpleEntryViewCodec.LAST_STORED_TIME_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
    private static VERSION_OFFSET = SimpleEntryViewCodec.LAST_UPDATE_TIME_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
    private static TTL_OFFSET = SimpleEntryViewCodec.VERSION_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
    private static MAX_IDLE_OFFSET = SimpleEntryViewCodec.TTL_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
    private static INITIAL_FRAME_SIZE = SimpleEntryViewCodec.MAX_IDLE_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;

    constructor() {
    }

    public static encode(clientMessage: ClientMessage,entryView : EntryView<Data, Data>): void {
        clientMessage.add(ClientMessage.BEGIN_FRAME);
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(SimpleEntryViewCodec.INITIAL_FRAME_SIZE));

        FixedSizeTypes.encodeLong(initialFrame.content, SimpleEntryViewCodec.COST_OFFSET, entryView.cost);
        FixedSizeTypes.encodeLong(initialFrame.content, SimpleEntryViewCodec.CREATION_TIME_OFFSET, entryView.creationTime);
        FixedSizeTypes.encodeLong(initialFrame.content, SimpleEntryViewCodec.EXPIRATION_TIME_OFFSET, entryView.expirationTime);
        FixedSizeTypes.encodeLong(initialFrame.content, SimpleEntryViewCodec.HITS_OFFSET, entryView.hits);
        FixedSizeTypes.encodeLong(initialFrame.content, SimpleEntryViewCodec.LAST_ACCESS_TIME_OFFSET, entryView.lastAccessTime);
        FixedSizeTypes.encodeLong(initialFrame.content, SimpleEntryViewCodec.LAST_STORED_TIME_OFFSET, entryView.lastStoreTime);
        FixedSizeTypes.encodeLong(initialFrame.content, SimpleEntryViewCodec.LAST_UPDATE_TIME_OFFSET, entryView.lastUpdateTime);
        FixedSizeTypes.encodeLong(initialFrame.content, SimpleEntryViewCodec.VERSION_OFFSET, entryView.version);
        FixedSizeTypes.encodeLong(initialFrame.content, SimpleEntryViewCodec.TTL_OFFSET, entryView.ttl);
        FixedSizeTypes.encodeLong(initialFrame.content, SimpleEntryViewCodec.MAX_IDLE_OFFSET, entryView.maxIdle);
        clientMessage.add(initialFrame);

        SimpleEntryViewCodec.encode(clientMessage, entryView[0]);
        SimpleEntryViewCodec.encode(clientMessage, entryView[1]);

        clientMessage.add(ClientMessage.END_FRAME);

    }

    public static decode(frame: Frame): EntryView<Data, Data> {
        frame = frame.next;
        var initialFrame : Frame = frame.next;

        var cost : Long = FixedSizeTypes.decodeLong(initialFrame.content, SimpleEntryViewCodec.COST_OFFSET);
        var creationTime : Long = FixedSizeTypes.decodeLong(initialFrame.content, SimpleEntryViewCodec.CREATION_TIME_OFFSET);
        var expirationTime : Long = FixedSizeTypes.decodeLong(initialFrame.content, SimpleEntryViewCodec.EXPIRATION_TIME_OFFSET);
        var hits : Long = FixedSizeTypes.decodeLong(initialFrame.content, SimpleEntryViewCodec.HITS_OFFSET);
        var lastAccessTime : Long = FixedSizeTypes.decodeLong(initialFrame.content, SimpleEntryViewCodec.LAST_ACCESS_TIME_OFFSET);
        var lastStoredTime : Long = FixedSizeTypes.decodeLong(initialFrame.content, SimpleEntryViewCodec.LAST_STORED_TIME_OFFSET);
        var lastUpdateTime : Long = FixedSizeTypes.decodeLong(initialFrame.content, SimpleEntryViewCodec.LAST_UPDATE_TIME_OFFSET);
        var version : Long = FixedSizeTypes.decodeLong(initialFrame.content, SimpleEntryViewCodec.VERSION_OFFSET);
        var ttl : Long = FixedSizeTypes.decodeLong(initialFrame.content, SimpleEntryViewCodec.TTL_OFFSET);
        var maxIdle : Long= FixedSizeTypes.decodeLong(initialFrame.content, SimpleEntryViewCodec.MAX_IDLE_OFFSET);

        var key : Data = DataCodec.decode(frame);
        var value : Data = DataCodec.decode(frame);

        CodecUtil.fastForwardToEndFrame(frame);

        var entryView : EntryView<Data, Data> =  new EntryView<Data, Data>();
        entryView.key = key;
        entryView.value = value;

        entryView.cost = cost;
        entryView.creationTime = creationTime;
        entryView.expirationTime = expirationTime;
        entryView.hits = hits;
        entryView.lastAccessTime = lastAccessTime;
        entryView.lastStoreTime = lastStoredTime;
        entryView.lastUpdateTime = lastUpdateTime;
        entryView.version = version;
        entryView.ttl = ttl;
        entryView.maxIdle = maxIdle;

        return entryView;
    }


}
