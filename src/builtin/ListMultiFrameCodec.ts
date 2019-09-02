import {ClientMessage, Frame} from "../ClientMessage";
import {CodecUtil} from "./CodecUtil";

export class ListMultiFrameCodec {

    constructor() {
    }

    public static encode<T>(clientMessage: ClientMessage, collection: Array<T>, encodeFunction: (clientMessage: ClientMessage, value: T) => void): void {
        clientMessage.add(ClientMessage.BEGIN_FRAME);
        var itemCount: number = collection.length;
        for (var i = 0; i < itemCount; i++) {
            encodeFunction(clientMessage, collection[i]);
        }
        clientMessage.add(ClientMessage.END_FRAME);
    }

    public static encodeContainsNullable<T>(clientMessage: ClientMessage, collection: Array<T>,
                                            encodeFunction: (clientMessage: ClientMessage, value: T) => void): void {
        clientMessage.add(ClientMessage.BEGIN_FRAME);
        var itemCount: number = collection.length;
        for (var i = 0; i < itemCount; i++) {
            if (collection[i] == null) {
                clientMessage.add(ClientMessage.NULL_FRAME);
            } else {

                encodeFunction(clientMessage, collection[i]);
            }
            clientMessage.add(ClientMessage.END_FRAME);
        }
    }


    public static encodeNullable<T>(clientMessage: ClientMessage, collection: Array<T>,
                                    encodeFunction: (clientMessage: ClientMessage, value: T) => void): void {
        if (collection == null) {
            clientMessage.add(ClientMessage.NULL_FRAME);
        } else {
            ListMultiFrameCodec.encode(clientMessage, collection, encodeFunction);
        }
    }

    public static decode<T>(frame: Frame, decodeFunction: (frame_: Frame) => T): Array<T> {
        var result: Array<T> = new Array<T>();
        //begin frame, list
        frame = frame.next;
        while (!CodecUtil.nextFrameIsDataStructureEndFrame(frame)) {
            result.push(decodeFunction(frame));
        }
        //end frame, list
        frame = frame.next;
        return result;
    }

    public static decodeContainsNullable<T>(frame: Frame, decodeFunction: (frame: Frame) => T): Array<T> {
        var result: Array<T> = new Array<T>();
        //begin frame, list
        frame = frame.next;
        while (!CodecUtil.nextFrameIsDataStructureEndFrame(frame)) {
            result.push(CodecUtil.nextFrameIsNullEndFrame(frame) ? null : decodeFunction.apply(frame));
        }
        //end frame, list
        frame = frame.next;
        return result;
    }


    public static decodeNullable<T>(frame: Frame, decodeFunction: (frame: Frame) => T): Array<T> {
        return CodecUtil.nextFrameIsNullEndFrame(frame) ? null : ListMultiFrameCodec.decode(frame, decodeFunction);
    }
}
