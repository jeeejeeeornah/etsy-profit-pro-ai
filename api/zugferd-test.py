from http.server import BaseHTTPRequestHandler
import json
import sys


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            import importlib.metadata
            version = importlib.metadata.version("factur-x")
            payload = {
                "status": "ok",
                "facturx_version": version,
                "python_version": sys.version,
            }
        except Exception as e:
            payload = {
                "status": "error",
                "error": str(e),
                "python_version": sys.version,
            }

        body = json.dumps(payload).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
