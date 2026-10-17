import http.server
import socketserver
import os
import mimetypes

PORT = int(os.environ.get("PORT", 3000))

# Ensure key MIME types are set
mimetypes.add_type("application/wasm", ".wasm")
mimetypes.add_type("image/ktx2", ".ktx2")
mimetypes.add_type("application/octet-stream", ".drc")
mimetypes.add_type("application/octet-stream", ".bin")
mimetypes.add_type("image/x-exr", ".exr")
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/javascript", ".mjs")

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        super().end_headers()

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Igloo Inc Clone server running at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
