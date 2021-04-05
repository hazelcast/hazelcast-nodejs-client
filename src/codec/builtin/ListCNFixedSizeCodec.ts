import {ClientMessage, Frame} from '../../protocol/ClientMessage';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';

/** @internal */
export class ListCNFixedSizeCodec {

    static encode<T>(
        clientMessage: ClientMessage,
        items: T[],
        itemSizeInBytes: number,
        encoder: (buffer: Buffer, offset: number, item: T) => void
    ): void {
        return;
    }

    static encodeHeader(frame: Frame, type: number, size: number): void {
        FixSizedTypesCodec.encodeByte(frame.content, 0, type);
        FixSizedTypesCodec.encodeInt(frame.content, 1, size);
    }

    static decode<T>(
        frame: Frame,
        itemSizeInBytes: number,
        decoder: (buffer: Buffer, position: number) => T
    ): T[] {
        return [];
    }
}
