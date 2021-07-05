import argparse
import json

from util import (
    ClientKind,
    ClientReleaseParser,
    StableReleaseFilter,
    MajorVersionFilter,
    MatrixOptionKind,
    get_option_from_release,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Returns the client matrix for the selected option as a JSON array"
    )

    parser.add_argument(
        "--client",
        dest="client",
        action="store",
        type=str,
        choices=[kind.name.lower() for kind in ClientKind],
        required=True,
        help="Client type",
    )

    parser.add_argument(
        "--option",
        dest="option",
        action="store",
        type=str,
        choices=[kind.name.lower() for kind in MatrixOptionKind],
        required=True,
        help="Matrix option type",
    )

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    client_kind = ClientKind[args.client.upper()]
    matrix_option_kind = MatrixOptionKind[args.option.upper()]

    filters = [
        MajorVersionFilter([4]),
        StableReleaseFilter(),
    ]
    client_release_parser = ClientReleaseParser(client_kind, filters)

    releases = client_release_parser.get_all_releases()

    options = [
        get_option_from_release(release, matrix_option_kind) for release in releases
    ]
    print(json.dumps(options))
