export function assertNotNull(v: any) {
    if (v == null) {
        throw new RangeError('Null or undefined is not allowed here.');
    }
}
