
export class Long {
    private value: bigint;
    private unsigned = false;

    static ONE = new Long(1);
    static ZERO = new Long(0);
    static NEG_ONE = new Long(-1);

    private constructor(v: any, unsigned?: boolean) {
        const u = (unsigned === undefined)? false : unsigned;
        this.value = u? BigInt.asUintN(64, BigInt(v)) : BigInt.asIntN(64, BigInt(v));
        this.unsigned = u;
    }

    static fromLowHigh(low: number, high: number, unsigned?: boolean): Long {
        const l = BigInt.asUintN(32, BigInt(low));
        const h = BigInt.asUintN(32, BigInt(high));
        const bv = (h << 32n) | l;
        const v = unsigned? BigInt.asUintN(64, bv) : BigInt.asIntN(64, bv);
        return new Long(v, unsigned);
    }

    static fromString(s: string, unsigned: boolean, radix: number): Long {
        const bv = BigInt(s);
        // const v = unsigned? BigInt.asUintN(radix, bv) : BigInt.asIntN(radix, bv);
        return new Long(bv, unsigned);
    }

    static fromNumber(num?: number): Long {
        if (num === undefined) {
            num = 0;
        }
        return new Long(num);
    }

    static fromValue(v: any): Long {
        return new Long(v);
    }

    static isLong(v: any): boolean {
        if (v === null || v === undefined) {
            return false;
        }
        if (!v.hasOwnProperty('value')) {
            return false;
        }
        return typeof v['value'] === 'bigint';
    }

    isUnsigned(): boolean {
        return this.unsigned;
    }

    clone(): Long {
        return new Long(this.value, this.unsigned);
    }

    negate(): Long {
        return new Long(-this.value);
    }

    equals(other: Long): boolean {
        return this.value == other.value;
    }

    equalsN(other: number): boolean {
        return this.value == BigInt(other);
    }

    notEquals(other: Long): boolean {
        return !this.equals(other);
    }

    notEqualsN(other: number): boolean {
        return !this.equalsN(other);
    }

    greaterThan(other: Long): boolean {
        return this.value > other.value;
    }

    greaterThanN(other: number): boolean {
        return this.value > other;
    }

    greaterThanOrEqual(other: Long): boolean {
        return this.value >= other.value;
    }

    greaterThanOrEqualN(other: number): boolean {
        return this.value >= other;
    }

    lessThan(other: Long): boolean {
        return this.value < other.value;
    }

    shiftRight(num: number): Long {
        return new Long(this.value >> BigInt(num));
    }

    shiftRightUnsigned(n: number): Long {
        const bn = BigInt(n)
        // return new Long((this.value>>bn) & (0x7fffffffn>>(bn-1n)));
        return new Long(BigInt.asUintN(64, this.value) >> bn);
    }

    and(right: Long): Long {
        return new Long(this.value & right.value);
    }

    andN(right: number): Long {
        return new Long(this.value & BigInt(right));
    }
    //
    // negate(): Long {
    //     return new Long(~this.value);
    // }

    xor(right: Long): Long {
        return new Long(this.value ^ right.value);
    }

    xorN(right: number): Long {
        return new Long(this.value ^ BigInt(right));
    }

    toNumber(): number {
        return Number(this.value);
    }

    getHighBitsUnsigned(): number {
        return Number(BigInt.asUintN(64, this.value) >> 32n);
    }

    getLowBitsUnsigned(): number {
        return Number(BigInt.asUintN(32, this.value));
    }

    getLowHigh(): [number, number] {
        const low = BigInt.asIntN(32, this.value);
        const high = BigInt.asIntN(32, BigInt.asUintN(64, this.value) >> 32n);
        return [Number(low), Number(high)];
    }

    add(n: Long): Long {
        return new Long(this.value + n.value);
    }

    addN(n: number): Long {
        return new Long(this.value + BigInt(n));
    }

    subtract(n: Long): Long {
        return new Long(this.value - n.value);
    }

    subtractN(n: number): Long {
        return new Long(this.value - BigInt(n));
    }

    multiplyN(n: number): Long {
        return new Long(this.value - BigInt(n));
    }
}
