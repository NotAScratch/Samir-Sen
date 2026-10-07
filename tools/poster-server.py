"""Local-only poster preview server with a narrow image upload endpoint."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit


class PosterHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        self.root = Path(directory).resolve()
        super().__init__(*args, directory=str(self.root), **kwargs)

    def end_headers(self):
        # Poster tuning edits the robot modules over and over, so never serve a stale copy.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_PUT(self):
        path = urlsplit(self.path).path
        if not re.fullmatch(r"/assets/posters/[a-z]+\.webp", path):
            self.send_error(403, "PUT is restricted to poster WebP files")
            return

        length = self.headers.get("Content-Length")
        if length is None or not length.isdecimal():
            self.send_error(411, "Content-Length required")
            return
        target = self.root / path.lstrip("/")
        target.parent.mkdir(parents=True, exist_ok=True)
        remaining = int(length)
        with target.open("wb") as output:
            while remaining:
                chunk = self.rfile.read(min(remaining, 1024 * 1024))
                if not chunk:
                    target.unlink(missing_ok=True)
                    self.send_error(400, "Incomplete request body")
                    return
                output.write(chunk)
                remaining -= len(chunk)
        self.send_response(201)
        self.end_headers()
        self.wfile.write(b"poster saved")


def main():
    if len(sys.argv) != 3:
        raise SystemExit("usage: python tools/poster-server.py <root> <port>")
    root = Path(sys.argv[1]).resolve()
    if not root.is_dir():
        raise SystemExit(f"project root does not exist: {root}")
    server = ThreadingHTTPServer(("127.0.0.1", int(sys.argv[2])),
                                 lambda *args, **kwargs: PosterHandler(*args, directory=root, **kwargs))
    print(f"Serving {root} on http://127.0.0.1:{sys.argv[2]}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
