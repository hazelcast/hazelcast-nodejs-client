export class Utils {
    public static getStringSize(value: string, nullable: boolean = false): number {
        // int32 for string length
        var size = 4;

        if (nullable) {
            size += 1;
        }

        size += value == null ? 0 : value.length;

        return size;
    }

    public static calculateSizeString(value: string) {
        return this.getStringSize(value);
    }

    public static calculateSizeBuffer(value: Buffer) {
        var size = 4;
        size += value.length;
        return size;
    }
}
