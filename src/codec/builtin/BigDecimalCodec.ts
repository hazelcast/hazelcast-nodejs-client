import {ClientMessage} from '../../protocol/ClientMessage';
import {CodecUtil} from './CodecUtil';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';
import {BitsUtil} from '../../util/BitsUtil';

/** @internal */
export class BigDecimalCodec {

    static decode(clientMessage: ClientMessage): string {
        const buffer = clientMessage.nextFrame().content;
        const contentSize = FixSizedTypesCodec.decodeInt(buffer, 0);
        const body = buffer.slice(BitsUtil.INT_SIZE_IN_BYTES, BitsUtil.INT_SIZE_IN_BYTES + contentSize);

        const signBit = body.readUInt8(0);
        const isNegative = signBit > 127;
        if (isNegative) { // negative, convert two's complement to positive
            for (let i = 0; i < body.length; i++) {
                body[i] = ~body[i];
            }
        }
        const hexString = '0x' + body.toString('hex');

        const scale = FixSizedTypesCodec.decodeInt(buffer, BitsUtil.INT_SIZE_IN_BYTES + contentSize);
        let bigint = BigInt(hexString);
        if (isNegative) {
            // When converting from 2 s complement need to add 1 to the inverted bits.
            // Since adding 1 to a buffer is hard, it is done here.
            bigint += BigInt(1);
        }

        const bigIntString = bigint.toString();
        return BigDecimalCodec.toScale(bigIntString, scale, isNegative);
    }

    static decodeNullable(clientMessage: ClientMessage): string {
        return CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : BigDecimalCodec.decode(clientMessage);
    }

    static toScale(bigIntString: string, scale: number, isNegative: boolean): string {
        if (scale === 0) {
            return (isNegative ? '-' : '') + bigIntString;
        } else if (scale > 0) {
            if (scale < bigIntString.length) {
                return (isNegative ? '-' : '') + bigIntString.substring(0, bigIntString.length - scale) + '.'
                    + bigIntString.substring(bigIntString.length - scale);
            } else {
                const numberOfZerosAfterDecimal = scale - bigIntString.length;
                return (isNegative ? '-0.' : '0.') + '0'.repeat(numberOfZerosAfterDecimal) + bigIntString
            }
        } else {
            return (isNegative ? '-' : '') + bigIntString + '0'.repeat(-1 * scale);
        }
    }
}
