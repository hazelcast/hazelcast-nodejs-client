import * as Long from 'long';
export class UUID {
    readonly leastSignificant: Long;
    readonly mostSignificant: Long;

    constructor(mostSig: Long, leastSig: Long) {
        this.mostSignificant = mostSig;
        this.leastSignificant = leastSig;
    }

    equals(other: UUID) {
        if (other == null) {
            return false;
        }
        return other.mostSignificant.equals(this.mostSignificant) && other.leastSignificant.equals(this.leastSignificant);
    }

    /* tslint:disable:no-bitwise */
    toString(): string {
        let mostHigh = this.mostSignificant.getHighBitsUnsigned(); // (32) 32 32 32
        let mostLow = this.mostSignificant.getLowBitsUnsigned(); // 32 (32) 32 32
        let leastHigh = this.leastSignificant.getHighBitsUnsigned(); // 32 32 (32) 32
        let leastLow = this.leastSignificant.getLowBitsUnsigned(); // 32 32 32 (32)

        let div1 = mostHigh.toString(16);
        let div2 = (mostLow >>> 16).toString(16);
        let div3 = (mostLow & ((1 << 16) - 1)).toString(16);
        let div4 = (leastHigh >>> 16).toString(16);
        let div5 = (leastHigh & ((1 << 16) - 1)).toString(16) + leastLow.toString(16);
        return div1 + '-' + div2 + '-' + div3 + '-' + div4 + '-' + div5;
    }
}
