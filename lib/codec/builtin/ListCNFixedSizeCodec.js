"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListCNFixedSizeCodec = void 0;
const FixSizedTypesCodec_1 = require("./FixSizedTypesCodec");
const BitsUtil_1 = require("../../util/BitsUtil");
/** @internal */
class ListCNFixedSizeCodec {
    static decode(frame, itemSizeInBytes, decoder) {
        const type = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeByte(frame.content, 0);
        const count = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(frame.content, 1);
        const res = new Array(count);
        switch (type) {
            case ListCNFixedSizeCodec.TYPE_NULL_ONLY:
                for (let i = 0; i < count; i++) {
                    res[i] = null;
                }
                break;
            case ListCNFixedSizeCodec.TYPE_NOT_NULL_ONLY:
                for (let i = 0; i < count; i++) {
                    res[i] = decoder(frame.content, ListCNFixedSizeCodec.HEADER_SIZE + i * itemSizeInBytes);
                }
                break;
            default: {
                let position = ListCNFixedSizeCodec.HEADER_SIZE;
                let readCount = 0;
                while (readCount < count) {
                    const bitmask = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeByte(frame.content, position++);
                    for (let i = 0; i < ListCNFixedSizeCodec.ITEMS_PER_BITMASK && readCount < count; i++) {
                        const mask = 1 << i;
                        if ((bitmask & mask) === mask) {
                            res[readCount] = decoder(frame.content, position);
                            position += itemSizeInBytes;
                        }
                        else {
                            res[readCount] = null;
                        }
                        readCount++;
                    }
                }
            }
        }
        return res;
    }
}
exports.ListCNFixedSizeCodec = ListCNFixedSizeCodec;
ListCNFixedSizeCodec.TYPE_NULL_ONLY = 1;
ListCNFixedSizeCodec.TYPE_NOT_NULL_ONLY = 2;
ListCNFixedSizeCodec.TYPE_MIXED = 3;
ListCNFixedSizeCodec.HEADER_SIZE = BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
ListCNFixedSizeCodec.ITEMS_PER_BITMASK = 8;
//# sourceMappingURL=ListCNFixedSizeCodec.js.map