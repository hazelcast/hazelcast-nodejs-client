const BuildInfo = require('./BuildInfo');

export class BuildInfoLoader {
    static getClientVersion(): string {
        return BuildInfo.version;
    }
}
