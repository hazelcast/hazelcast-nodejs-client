"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListCNBooleanCodec = void 0;
const ListCNFixedSizeCodec_1 = require("./ListCNFixedSizeCodec");
const BitsUtil_1 = require("../../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./FixSizedTypesCodec");
/** @internal */
class ListCNBooleanCodec {
    static decode(clientMessage) {
        return ListCNFixedSizeCodec_1.ListCNFixedSizeCodec.decode(clientMessage.nextFrame(), BitsUtil_1.BitsUtil.BOOLEAN_SIZE_IN_BYTES, FixSizedTypesCodec_1.FixSizedTypesCodec.decodeBoolean);
    }
}
exports.ListCNBooleanCodec = ListCNBooleanCodec;
//# sourceMappingURL=ListCNBooleanCodec.js.map