"""Serve the exported Web build locally for play-testing.

Usage:
    python tools/serve_web.py [port] [folder]

Defaults: port 8060, folder build/web. Sends the right content types for
.wasm/.pck/.js, disables caching so a fresh export is always picked up, and
handles requests in parallel threads.
"""
import functools
import http.server
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8060
FOLDER = sys.argv[2] if len(sys.argv) > 2 else "build/web"


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".wasm": "application/wasm",
        ".pck": "application/octet-stream",
        ".js": "text/javascript",
        ".html": "text/html",
        ".png": "image/png",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stdout.write("%s %s\n" % (self.address_string(), fmt % args))
        sys.stdout.flush()


if __name__ == "__main__":
    handler = functools.partial(Handler, directory=FOLDER)
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler) as server:
        print(f"Serving {FOLDER} on http://localhost:{PORT}", flush=True)
        server.serve_forever()
