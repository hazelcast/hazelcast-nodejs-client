import argparse

from util import (
    SNAPSHOT_REPO,
    ENTERPRISE_SNAPSHOT_REPO,
    RELEASE_REPO,
    ENTERPRISE_RELEASE_REPO,
    download_via_maven,
    ServerKind,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Downloads the Hazelcast IMDG JARs for the given version and kind."
    )

    parser.add_argument(
        "--version",
        dest="version",
        action="store",
        type=str,
        required=True,
        help="IMDG version",
    )

    parser.add_argument(
        "--server-kind",
        dest="server_kind",
        action="store",
        type=str,
        required=True,
        choices=[kind.name.lower() for kind in ServerKind],
        help="The Hazelcast server type to download JARs for",
    )

    parser.add_argument(
        "--dst",
        dest="dst",
        action="store",
        type=str,
        required=True,
        help="Directory to download JARs into",
    )

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    version = args.version
    dst = args.dst
    server_kind = ServerKind[args.server_kind.upper()]

    if version.upper().endswith("-SNAPSHOT"):
        repo = SNAPSHOT_REPO
        enterprise_repo = ENTERPRISE_SNAPSHOT_REPO
    else:
        repo = RELEASE_REPO
        enterprise_repo = ENTERPRISE_RELEASE_REPO

    download_via_maven(repo, "hazelcast", version, dst, True)
    if server_kind == ServerKind.ENTERPRISE:
        download_via_maven(enterprise_repo, "hazelcast-enterprise-all", version, dst)
        download_via_maven(enterprise_repo, "hazelcast-enterprise", version, dst, True)
    else:
        download_via_maven(repo, "hazelcast-all", version, dst)
