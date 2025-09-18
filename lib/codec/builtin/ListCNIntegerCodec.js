"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListCNIntegerCodec = void 0;
const ListCNFixedSizeCodec_1 = require("./ListCNFixedSizeCodec");
const BitsUtil_1 = require("../../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./FixSizedTypesCodec");
/** @internal */
class ListCNIntegerCodec {
    static decode(clientMessage) {
        return ListCNFixedSizeCodec_1.ListCNFixedSizeCodec.decode(clientMessage.nextFrame(), BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES, FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt);
    }
}
exports.ListCNIntegerCodec = ListCNIntegerCodec;
//# sourceMappingURL=ListCNIntegerCodec.js.map