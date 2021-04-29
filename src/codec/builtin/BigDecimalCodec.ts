import {ClientMessage} from '../../protocol/ClientMessage';
import {CodecUtil} from './CodecUtil';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';
import {BitsUtil} from '../../util/BitsUtil';

function bytes2hexString(uint8array: Uint8Array): string { // buffer is an ArrayBuffer
    return '0x' + [...uint8array].map(x => x.toString(16).padStart(2, '0')).join('');
}

/** @internal */
export class BigDecimalCodec {

    static decode(clientMessage: ClientMessage): string {
        const buffer = clientMessage.nextFrame().content;
        const contentSize = FixSizedTypesCodec.decodeInt(buffer, 0);
        const body = new Uint8Array(buffer.slice(BitsUtil.INT_SIZE_IN_BYTES, BitsUtil.INT_SIZE_IN_BYTES + contentSize));
        const scale = FixSizedTypesCodec.decodeInt(buffer, BitsUtil.INT_SIZE_IN_BYTES + contentSize);

        const hexString = bytes2hexString(body);
        const bigint = BigInt(hexString);

        const bigIntString = bigint.toString();
        return BigDecimalCodec.toScale(bigIntString, scale);
    }

    static decodeNullable(clientMessage: ClientMessage): string {
        return CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : BigDecimalCodec.decode(clientMessage);
    }

    static toScale(bigIntString: string, scale: number): string {
        if (scale === 0) {
            return bigIntString;
        } else if (scale > 0) {
            // '1111'
            if (scale < bigIntString.length) {
                return bigIntString.substring(0, bigIntString.length - scale) + '.'
                    + bigIntString.substring(bigIntString.length - scale);
            } else {
                const numberOfZerosAfterDecimal = scale - bigIntString.length;
                return '0.' + '0'.repeat(numberOfZerosAfterDecimal) + bigIntString
            }
        } else {
            return bigIntString + '0'.repeat(-1 * scale);
        }
    }
}
