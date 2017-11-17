export class BuildMetadata {
    public static readonly UNKNOWN_VERSION_ID = -1;

    private static readonly MAJOR_VERSION_MULTIPLIER = 10000;
    private static readonly MINOR_VERSION_MULTIPLIER = 100;

    private static readonly PATTERN = /^([\d]+)\.([\d]+)(?:\.([\d]+))?(-[\w]+)?(-SNAPSHOT)?$/;

    public static calculateVersion(versionString: string): number {
        if (versionString == null) {
            return BuildMetadata.UNKNOWN_VERSION_ID;
        }
        const info = BuildMetadata.PATTERN.exec(versionString);
        if (info == null) {
            return -1;
        }
        const major = Number.parseInt(info[1]);
        const minor = Number.parseInt(info[2]);
        let patch: number;
        if (info[3] == null) {
            patch = 0;
        } else {
            patch = Number.parseInt(info[3]);
        }
        return BuildMetadata.MAJOR_VERSION_MULTIPLIER * major + BuildMetadata.MINOR_VERSION_MULTIPLIER * minor + patch;
    }

}

