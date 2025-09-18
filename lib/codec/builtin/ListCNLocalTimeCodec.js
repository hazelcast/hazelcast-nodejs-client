"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListCNLocalTimeCodec = void 0;
const ListCNFixedSizeCodec_1 = require("./ListCNFixedSizeCodec");
const BitsUtil_1 = require("../../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./FixSizedTypesCodec");
/** @internal */
class ListCNLocalTimeCodec {
    static decode(clientMessage) {
        return ListCNFixedSizeCodec_1.ListCNFixedSizeCodec.decode(clientMessage.nextFrame(), BitsUtil_1.BitsUtil.LOCAL_TIME_SIZE_IN_BYTES, FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLocalTime);
    }
}
exports.ListCNLocalTimeCodec = ListCNLocalTimeCodec;
//# sourceMappingURL=ListCNLocalTimeCodec.js.map