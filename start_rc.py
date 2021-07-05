import argparse
import os
import socket
import subprocess
import time
from contextlib import closing
from os import path

from util import (
    SNAPSHOT_REPO,
    RELEASE_REPO,
    download_via_maven,
    IS_ON_WINDOWS,
    ServerKind,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Starts the remote controller")

    parser.add_argument(
        "--rc-version",
        dest="rc_version",
        action="store",
        type=str,
        required=True,
        help="Remote controller version",
    )

    parser.add_argument(
        "--jars",
        dest="jars",
        action="store",
        type=str,
        required=True,
        help="The name of the folder that will contain the JAR files",
    )

    parser.add_argument(
        "--server-kind",
        dest="server_kind",
        action="store",
        type=str,
        required=True,
        choices=[kind.name.lower() for kind in ServerKind],
        help="The Hazelcast server type that the tests should be running for",
    )

    parser.add_argument(
        "--use-simple-server",
        dest="use_simple_server",
        action="store_true",
        default=False,
        required=False,
        help="Use the RC in simple server mode",
    )

    return parser.parse_args()


def start_rc(
    rc_version: str, dst_folder: str, use_simple_server: bool, server_kind: ServerKind
) -> None:
    if rc_version.upper().endswith("-SNAPSHOT"):
        rc_repo = SNAPSHOT_REPO
    else:
        rc_repo = RELEASE_REPO

    download_via_maven(rc_repo, "hazelcast-remote-controller", rc_version, dst_folder)
    class_path = path.join(dst_folder, "*")

    args = [
        "java",
        "-cp",
        class_path,
        "com.hazelcast.remotecontroller.Main",
    ]

    if use_simple_server:
        args.append("--use-simple-server")

    enterprise_key = os.environ.get("HAZELCAST_ENTERPRISE_KEY", None)
    if server_kind == ServerKind.ENTERPRISE and enterprise_key:
        args.insert(1, "-Dhazelcast.enterprise.license.key=" + enterprise_key)

    rc_stdout = open("rc_stdout.log", "w")
    rc_stderr = open("rc_stderr.log", "w")

    subprocess.Popen(args=args, stdout=rc_stdout, stderr=rc_stderr, shell=IS_ON_WINDOWS)


def wait_until_rc_is_ready() -> None:
    timeout = 300 + time.time()
    while time.time() < timeout:
        with closing(socket.socket()) as sock:
            if sock.connect_ex(("localhost", 9701)) == 0:
                return
            print("Remote controller is not ready yet. Sleeping 1 second.")
            time.sleep(1)

    raise Exception("Remote controller failed to start.")


if __name__ == "__main__":
    args = parse_args()
    rc_version = args.rc_version
    jars = args.jars
    server_kind = ServerKind[args.server_kind.upper()]
    use_simple_server = args.use_simple_server
    start_rc(rc_version, jars, use_simple_server, server_kind)
    wait_until_rc_is_ready()
