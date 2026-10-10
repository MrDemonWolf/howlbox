import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

base_path = (os.environ.get("BASE_PATH") or "/").rstrip("/")


class BasePathHandler(SimpleHTTPRequestHandler):
	def translate_path(self, path):
		if base_path and (path == base_path or path.startswith(f"{base_path}/")):
			path = path[len(base_path) :] or "/"
		return super().translate_path(path)


ThreadingHTTPServer.request_queue_size = 64
server = ThreadingHTTPServer(
	("127.0.0.1", 4173),
	partial(BasePathHandler, directory="apps/web/dist"),
)
server.serve_forever()
