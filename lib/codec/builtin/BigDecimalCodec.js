"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigDecimalCodec = void 0;
const CodecUtil_1 = require("./CodecUtil");
const BitsUtil_1 = require("../../util/BitsUtil");
const BigDecimalUtil_1 = require("../../util/BigDecimalUtil");
const core_1 = require("../../core");
const FixSizedTypesCodec_1 = require("./FixSizedTypesCodec");
/** @internal */
class BigDecimalCodec {
    static decode(clientMessage) {
        const buffer = clientMessage.nextFrame().content;
        const contentSize = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(buffer, 0);
        const body = buffer.slice(BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES, BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES + contentSize);
        const scale = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(buffer, BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES + contentSize);
        return new core_1.BigDecimal((0, BigDecimalUtil_1.bufferToBigInt)(body), scale);
    }
    static decodeNullable(clientMessage) {
        return CodecUtil_1.CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : BigDecimalCodec.decode(clientMessage);
    }
}
exports.BigDecimalCodec = BigDecimalCodec;
//# sourceMappingURL=BigDecimalCodec.js.map