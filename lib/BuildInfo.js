"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildInfo = void 0;
const clientVersion = require('../package.json').version;
/** @internal */
class BuildInfo {
    static calculateServerVersionFromString(versionString) {
        if (versionString == null) {
            return BuildInfo.UNKNOWN_VERSION_ID;
        }
        const mainParts = versionString.split('-');
        const tokens = mainParts[0].split('.');
        if (tokens.length < 2) {
            return BuildInfo.UNKNOWN_VERSION_ID;
        }
        const major = +tokens[0];
        const minor = +tokens[1];
        const patch = (tokens.length === 2) ? 0 : +tokens[2];
        const version = this.calculateServerVersion(major, minor, patch);
        // version is NaN when one of major, minor and patch is not a number.
        return isNaN(version) ? BuildInfo.UNKNOWN_VERSION_ID : version;
    }
    static calculateServerVersion(major, minor, patch) {
        return BuildInfo.MAJOR_VERSION_MULTIPLIER * major + BuildInfo.MINOR_VERSION_MULTIPLIER * minor + patch;
    }
    static getClientVersion() {
        return clientVersion;
    }
    static calculateMemberVersion(m) {
        return BuildInfo.calculateServerVersion(m.major, m.minor, m.patch);
    }
}
exports.BuildInfo = BuildInfo;
BuildInfo.UNKNOWN_VERSION_ID = -1;
BuildInfo.MAJOR_VERSION_MULTIPLIER = 10000;
BuildInfo.MINOR_VERSION_MULTIPLIER = 100;
//# sourceMappingURL=BuildInfo.js.map