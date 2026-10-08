"""Loopback-only Laya decision service. Inference never downloads or calls APIs."""
import json
import os
import time
import argparse
import hmac
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN"] = "1"
os.environ["USE_TF"] = "0"

import torch
import laya

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description="Local-only Laya worker")
parser.add_argument("--port", type=int, default=39401)
parser.add_argument("--token-file", type=Path)
args = parser.parse_args()
if not 1 <= args.port <= 65535:
    raise SystemExit("Invalid local port.")
token = args.token_file.read_text().strip() if args.token_file else None
MODEL = ROOT / ".runtime" / "models" / "laya-multilingual"
if not (MODEL / "model.safetensors").is_file():
    raise SystemExit("Missing model. Run pnpm run laya:download once before offline inference.")
torch.set_num_threads(4)
torch.set_num_interop_threads(1)
started = time.perf_counter()
agent = laya.load(str(MODEL), device="cpu")
load_ms = round((time.perf_counter() - started) * 1000)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def reply(self, status, data):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        try:
            self.wfile.write(payload)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def admitted(self):
        host = self.headers.get("Host", "").split(":")[0]
        if self.client_address[0] != "127.0.0.1" or host not in ("127.0.0.1", "localhost") or self.headers.get("Origin") is not None:
            self.reply(403, {"error": "local-only"})
            return False
        if token and not hmac.compare_digest(self.headers.get("Authorization", ""), f"Bearer {token}"):
            self.reply(401, {"error": "internal-auth-required"})
            return False
        return True

    def do_GET(self):
        if not self.admitted():
            return
        if self.path != "/health":
            return self.reply(404, {"error": "not-found"})
        self.reply(200, {"ready": True, "model": "laya-multilingual", "runtime": f"laya {laya.__version__}", "device": "cpu", "offline": True, "loadMs": load_ms})

    def do_POST(self):
        if not self.admitted():
            return
        if self.path != "/v1/systemone":
            return self.reply(404, {"error": "not-found"})
        if self.headers.get("Origin"):
            return self.reply(403, {"error": "browser-access-disabled"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > 65536:
                return self.reply(413, {"error": "request-too-large"})
            request = json.loads(self.rfile.read(length))
            questions = request["questions"]
            if set(questions) != {"executor"} or questions["executor"]["type"] != "choice":
                return self.reply(400, {"error": "only-executor-choice-supported"})
            criteria = questions["executor"]["criteria"]
            if not isinstance(criteria, dict) or not 2 <= len(criteria) <= 6:
                return self.reply(400, {"error": "invalid-candidates"})
            began = time.perf_counter()
            result = agent.predict(request["state"], questions, max_len=1024)
            result["model"] = "convaiinnovations/laya-multilingual"
            result["elapsedMs"] = round((time.perf_counter() - began) * 1000)
            self.reply(200, result)
        except (KeyError, ValueError, TypeError) as error:
            self.reply(400, {"error": type(error).__name__})
        except Exception as error:
            print(f"Laya inference failed: {type(error).__name__}", flush=True)
            self.reply(500, {"error": "inference-failed"})


server = HTTPServer(("127.0.0.1", args.port), Handler)
print(json.dumps({"url": f"http://127.0.0.1:{args.port}", "ready": True, "offline": True, "loadMs": load_ms}), flush=True)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
