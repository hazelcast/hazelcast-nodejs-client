import {ClientMessage, Frame} from '../ClientMessage';
import {CodecUtil} from './CodecUtil';

export class ListMultiFrameCodec {

    // tslint:disable-next-line:no-empty
    constructor() {
    }

    // tslint:disable-next-line:max-line-length
    public static encode<T>(clientMessage: ClientMessage, collection: T[], encodeFunction: (clientMessage: ClientMessage, value: T) => void): void {
        clientMessage.add(ClientMessage.BEGIN_FRAME);
        const itemCount: number = collection.length;
        for (let i = 0; i < itemCount; i++) {
            encodeFunction(clientMessage, collection[i]);
        }
        clientMessage.add(ClientMessage.END_FRAME);
    }

    public static encodeContainsNullable<T>(clientMessage: ClientMessage, collection: T[],
                                            encodeFunction: (clientMessage: ClientMessage, value: T) => void): void {
        clientMessage.add(ClientMessage.BEGIN_FRAME);
        const itemCount: number = collection.length;
        for (let i = 0; i < itemCount; i++) {
            if (collection[i] == null) {
                clientMessage.add(ClientMessage.NULL_FRAME);
            } else {

                encodeFunction(clientMessage, collection[i]);
            }
            clientMessage.add(ClientMessage.END_FRAME);
        }
    }

    public static encodeNullable<T>(clientMessage: ClientMessage, collection: T[],
                                    encodeFunction: (clientMessage: ClientMessage, value: T) => void): void {
        if (collection == null) {
            clientMessage.add(ClientMessage.NULL_FRAME);
        } else {
            ListMultiFrameCodec.encode(clientMessage, collection, encodeFunction);
        }
    }

    // tslint:disable-next-line:variable-name
    public static decode<T>(frame: Frame, decodeFunction: (frame_: Frame) => T): T[] {
        const result: T[] = new Array<T>();
        frame = frame.next;
        while (!CodecUtil.nextFrameIsDataStructureEndFrame(frame)) {
            result.push(decodeFunction(frame));
        }
        frame = frame.next;
        return result;
    }

    public static decodeContainsNullable<T>(frame: Frame, decodeFunction: (frame: Frame) => T): T[] {
        const result: T[] = new Array<T>();
        frame = frame.next;
        while (!CodecUtil.nextFrameIsDataStructureEndFrame(frame)) {
            result.push(CodecUtil.nextFrameIsNullEndFrame(frame) ? null : decodeFunction.apply(frame));
        }
        frame = frame.next;
        return result;
    }

    public static decodeNullable<T>(frame: Frame, decodeFunction: (frame: Frame) => T): T[] {
        return CodecUtil.nextFrameIsNullEndFrame(frame) ? null : ListMultiFrameCodec.decode(frame, decodeFunction);
    }
}
