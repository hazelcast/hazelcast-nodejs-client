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



export class MapStringLongCodec {

    constructor() {
    }

    public static encode(clientMessage: ClientMessage, collection : Array<[string,Long]>): void {
        var valueList : Array<Long> = new Array<Long>(collection.length);
        clientMessage.add(ClientMessage.BEGIN_FRAME);
        collection.forEach(entry => {
            StringCodec.encode(clientMessage, entry[0]);
            valueList.push(entry[1]);
        });

        clientMessage.add(ClientMessage.END_FRAME);

        ListLongCodec.encode(clientMessage, valueList);
    }

    public static decode(frame: Frame): Array<[string, Long]> {
        var listK : Array<string> = ListMultiFrameCodec.decode(frame, StringCodec.decode);
        var listV : Array<Long> = ListLongCodec.decode(frame);

        var result : Array<[string, Long]> = [];
        for (var i = 0; i < listK.length; i++) {
            result.push([listK[i], listV[i]]);
        }

    return result;
    }


}
