import {ClientMessage, Frame} from '../../protocol/ClientMessage';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';
import {BitsUtil} from '../../util/BitsUtil';
import * as assert from 'assert';

/** @internal */
export class ListCNFixedSizeCodec {
    static readonly TYPE_NULL_ONLY = 1;
    static readonly TYPE_NOT_NULL_ONLY = 2;
    static readonly TYPE_MIXED = 3;
    static readonly HEADER_SIZE = BitsUtil.BYTE_SIZE_IN_BYTES + BitsUtil.INT_SIZE_IN_BYTES;
    static readonly ITEMS_PER_BITMASK = 8;

    static encode<T>(
        clientMessage: ClientMessage,
        items: T[],
        itemSizeInBytes: number,
        encoder: (buffer: Buffer, offset: number, item: T) => void
    ): void {
        // TODO: delete this method and other encodes
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
        const type = FixSizedTypesCodec.decodeByte(frame.content, 0);
        const count = FixSizedTypesCodec.decodeInt(frame.content, 1);

        const res = [];
        switch (type) {
            case ListCNFixedSizeCodec.TYPE_NULL_ONLY:
                for (let i = 0; i < count; i++) {
                    res.push(null);
                }
                break;
            case ListCNFixedSizeCodec.TYPE_NOT_NULL_ONLY:
                for (let i = 0; i < count; i++) {
                    res.push(decoder(frame.content, ListCNFixedSizeCodec.HEADER_SIZE + i * itemSizeInBytes));
                }
                break;
            default:
                assert.strictEqual(type, ListCNFixedSizeCodec.TYPE_MIXED, 'Invalid type');
                let position = ListCNFixedSizeCodec.HEADER_SIZE;
                let readCount = 0;
                while (readCount < count) {
                    const bitmask = FixSizedTypesCodec.decodeByte(frame.content, position);
                    for (let i = 0; i < ListCNFixedSizeCodec.ITEMS_PER_BITMASK && readCount < count; i++) {
                        const mask = 1 << i;
                        if ((bitmask & mask) === mask) {
                            res.push(decoder(frame.content, position));
                            position += itemSizeInBytes;
                        } else {
                            res.push(null);
                        }
                        readCount++;
                    }
                }
                assert.strictEqual(readCount, res.length, 'Invalid read count');
                break;
        }
        return [];
    }
}
