import {ClientMessage, Frame} from "../ClientMessage";
import {Buffer} from 'safe-buffer';
import {BitsUtil} from "../BitsUtil";
import {FixedSizeTypes} from "./FixedSizeTypes";
// @ts-ignore
import * as Long from "long";
import {UUID} from '/Users/gulcesirvanci/Desktop/hazelcast-nodejs-client/lib/core/UUID';
import {StringCodec} from "./StringCodec";
import {ListLongCodec} from "./ListLongCodec";
import {ListMultiFrameCodec} from "./ListMultiFrameCodec";



export class MapUUIDLongCodec {

    private static ENTRY_SIZE_IN_BYTES : number = FixedSizeTypes.UUID_SIZE_IN_BYTES + BitsUtil.LONG_SIZE_IN_BYTES;

    constructor() {
    }

    public static encode(clientMessage: ClientMessage, collection : Array<[UUID,Long]>): void {
        var itemCount: number = collection.length;
        var frame: Frame = new Frame(Buffer.allocUnsafe(itemCount * MapUUIDLongCodec.ENTRY_SIZE_IN_BYTES));
        var iterator: Array<[UUID, Long]> = collection;

        for (var i = 0; i < itemCount; i++) {
            var entry : Map<UUID, Long> = iterator[i];
            FixedSizeTypes.encodeUUID(frame.content, i * MapUUIDLongCodec.ENTRY_SIZE_IN_BYTES, entry[0]);
            FixedSizeTypes.encodeLong(frame.content, i * MapUUIDLongCodec.ENTRY_SIZE_IN_BYTES + FixedSizeTypes.UUID_SIZE_IN_BYTES, entry.getValue());
        }
        clientMessage.add(frame);
    }

    public static decode(frame: Frame): Array<[UUID,Long]> {
        var itemCount: number = frame.content.length / MapUUIDLongCodec.ENTRY_SIZE_IN_BYTES;
        var result: Array<[UUID,Long]> = new Array<[UUID, Long]>();
        for (var i = 0; i < itemCount; i++) {
            var key : UUID = FixedSizeTypes.decodeUUID(frame.content, i * MapUUIDLongCodec.ENTRY_SIZE_IN_BYTES);
            var value : Long = FixedSizeTypes.decodeLong(frame.content, i * MapUUIDLongCodec.ENTRY_SIZE_IN_BYTES + FixedSizeTypes.UUID_SIZE_IN_BYTES);
            var map  = new Map();
            map.set(key, value);
            result.push(map);
        }
        return result;
    }


}
