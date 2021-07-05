import argparse
import json
from typing import List

from util import (
    MajorVersionFilter,
    ServerReleaseParser,
    get_latest_patch_releases,
    ReleaseFilter,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Returns the server version matrix as a JSON array"
    )

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    filters: List[ReleaseFilter] = [MajorVersionFilter([4])]
    server_release_parser = ServerReleaseParser(filters)
    releases = server_release_parser.get_all_releases()
    print(json.dumps(get_latest_patch_releases(releases)))
