"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListCNFloatCodec = void 0;
const ListCNFixedSizeCodec_1 = require("./ListCNFixedSizeCodec");
const BitsUtil_1 = require("../../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./FixSizedTypesCodec");
/** @internal */
class ListCNFloatCodec {
    static decode(clientMessage) {
        return ListCNFixedSizeCodec_1.ListCNFixedSizeCodec.decode(clientMessage.nextFrame(), BitsUtil_1.BitsUtil.FLOAT_SIZE_IN_BYTES, FixSizedTypesCodec_1.FixSizedTypesCodec.decodeFloat);
    }
}
exports.ListCNFloatCodec = ListCNFloatCodec;
//# sourceMappingURL=ListCNFloatCodec.js.map