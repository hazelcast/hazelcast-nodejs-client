export function assertNotNull(v: any) {
    if (v == null) {
        throw new RangeError('Null or undefined is not allowed here.');
    }
}
export function getType(obj: any): string {
    if (obj === null) {
        return null;
    } else {
        var t = typeof obj;
        if (t !== 'object') {
            return t;
        } else {
            return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        }
    }
}
