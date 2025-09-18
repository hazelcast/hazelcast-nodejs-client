"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListCNByteCodec = void 0;
const ListCNFixedSizeCodec_1 = require("./ListCNFixedSizeCodec");
const BitsUtil_1 = require("../../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./FixSizedTypesCodec");
/** @internal */
class ListCNByteCodec {
    static decode(clientMessage) {
        return ListCNFixedSizeCodec_1.ListCNFixedSizeCodec.decode(clientMessage.nextFrame(), BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES, FixSizedTypesCodec_1.FixSizedTypesCodec.decodeByte);
    }
}
exports.ListCNByteCodec = ListCNByteCodec;
//# sourceMappingURL=ListCNByteCodec.js.map