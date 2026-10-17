#!/usr/bin/env python3
"""Servidor de ejemplo de Yayen. Solo Python 3 (biblioteca estándar).

  python3 server/yayen_server.py            # http://127.0.0.1:8787 → la demo

Hace tres cosas:
  GET  /                    la demo (demo/index.html) y los archivos de src/
  POST /api/yayen/voz       {"text": "…"} → audio con la voz de Yayen (Piper local + ajuste «Digital» con ffmpeg)
  POST /api/yayen/hermes    {"text": "…"} → {"reply": "…"} preguntándole a Hermes con el token que solo vive aquí

Las credenciales se leen de server/.env (copia .env.example). Nunca llegan al navegador.
Los POST exigen la cabecera «X-Yayen: 1»: una página de otro sitio no puede mandarla sin permiso CORS.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import secrets
import shutil
import subprocess
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]


def load_env(path: Path) -> None:
    """KEY=valor por línea; no pisa variables ya definidas en el entorno."""
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return
    for line in lines:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env(Path(__file__).with_name(".env"))
cfg = lambda name, default="": os.environ.get(name) or default  # noqa: E731

HOST, PORT = cfg("YAYEN_HOST", "127.0.0.1"), int(cfg("YAYEN_PORT", "8787"))
PIPER = Path(cfg("YAYEN_PIPER", "/opt/yayen/piper/bin/piper"))
MODEL = Path(cfg("YAYEN_MODEL", "/opt/yayen/piper/voces/es_ES-mls_10246-low.onnx"))
PRESET = cfg("YAYEN_PRESET", "digital")
CACHE = Path(cfg("YAYEN_CACHE", str(ROOT / ".cache" / "voz")))
SLOTS = threading.Semaphore(1)
MAX_CHARS = 400
SYSTEM = cfg("YAYEN_SYSTEM_PROMPT",
             "Eres Yayen, la mascota y asistente del panel. Respondes en español, en una o dos frases cortas, "
             "con tono cercano y humano, como si hablaras en voz alta. Nada de listas ni markdown.")


class Unavailable(Exception):
    pass


# ---------------- voz ----------------
def voice_filter(preset: str, rate: int) -> str:
    """«digital»: +2 semitonos, un poco más rápida, coro y eco leves. Siempre recorta silencios largos."""
    trim = ("silenceremove=start_periods=1:start_threshold=-38dB:"
            "stop_periods=-1:stop_duration=0.3:stop_threshold=-38dB:stop_silence=0.18,")
    if preset == "digital":
        ratio = 2 ** (2 / 12)
        return (f"{trim}asetrate={rate}*{ratio:.6f},aresample=24000,atempo={1.03 / ratio:.4f},"
                "chorus=0.6:0.8:30:0.35:0.25:2,aecho=0.8:0.6:18:0.18,loudnorm=I=-16")
    return f"{trim}aresample=24000,loudnorm=I=-16"


def synthesize(text: str) -> tuple[bytes, str]:
    text = re.sub(r"\s+", " ", text or "").strip()[:MAX_CHARS]
    if not text:
        raise ValueError("Texto vacío")
    if not PIPER.exists() or not MODEL.exists():
        raise Unavailable("Voz local no instalada: corre tools/instalar-voz.sh (o ajusta YAYEN_PIPER y YAYEN_MODEL)")
    ffmpeg = shutil.which("ffmpeg")
    kind, ext = ("audio/mpeg", "mp3") if ffmpeg else ("audio/wav", "wav")
    out = CACHE / f"{hashlib.sha256(f'{MODEL.name}|{PRESET}|{text}'.encode()).hexdigest()[:32]}.{ext}"
    if out.exists():
        return out.read_bytes(), kind
    CACHE.mkdir(parents=True, exist_ok=True)
    wav = CACHE / f".{secrets.token_hex(6)}.wav"
    if not SLOTS.acquire(timeout=40):
        raise Unavailable("Yayen está ocupado hablando")
    try:
        run = subprocess.run([str(PIPER), "-m", str(MODEL), "-f", str(wav), "--length-scale", "0.8", "--sentence-silence", "0.15"],
                             input=text.encode(), capture_output=True, timeout=40)
        if run.returncode or not wav.exists():
            raise Unavailable(f"Piper falló: {run.stderr.decode(errors='replace')[-200:].strip()}")
        if ffmpeg:
            try:
                rate = int(json.loads(Path(f"{MODEL}.json").read_text(encoding="utf-8"))["audio"]["sample_rate"])
            except (OSError, ValueError, KeyError):
                rate = 22050
            tmp = out.with_name("." + out.name)
            run = subprocess.run([ffmpeg, "-v", "error", "-y", "-i", str(wav), "-af", voice_filter(PRESET, rate),
                                  "-c:a", "libmp3lame", "-b:a", "64k", str(tmp)], capture_output=True, timeout=40)
            if run.returncode:
                raise Unavailable(f"ffmpeg falló: {run.stderr.decode(errors='replace')[-200:].strip()}")
            tmp.replace(out)
        else:
            wav.replace(out)
    except subprocess.TimeoutExpired:
        raise Unavailable("La voz tardó demasiado")
    finally:
        SLOTS.release()
        wav.unlink(missing_ok=True)
    return out.read_bytes(), kind


# ---------------- Hermes ----------------
def ask_hermes(text: str) -> str:
    base, token = cfg("HERMES_URL").rstrip("/"), cfg("HERMES_TOKEN")
    if not base:
        raise Unavailable("Falta HERMES_URL en server/.env")
    body = {"messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": text[:2000]}]}
    if cfg("HERMES_MODEL"):
        body["model"] = cfg("HERMES_MODEL")
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = Request(base + cfg("HERMES_CHAT_PATH", "/v1/chat/completions"), data=json.dumps(body).encode(), headers=headers, method="POST")
    try:
        with urlopen(req, timeout=int(cfg("HERMES_TIMEOUT", "60"))) as res:
            data = json.loads(res.read() or b"{}")
    except HTTPError as error:
        raise Unavailable({401: "Hermes rechazó el token (HERMES_TOKEN)", 403: "El token no tiene permiso",
                           404: "La ruta no existe (HERMES_CHAT_PATH)"}.get(error.code, f"Hermes respondió {error.code}"))
    except (URLError, OSError, ValueError) as error:
        raise Unavailable(f"No pude llegar a Hermes: {getattr(error, 'reason', error)}")
    # Formato OpenAI (choices[0].message.content) o un JSON simple con reply / response / output / text
    try:
        return str(data["choices"][0]["message"]["content"]).strip()
    except (KeyError, IndexError, TypeError):
        for key in ("reply", "response", "output", "text", "message"):
            if isinstance(data.get(key), str):
                return data[key].strip()
    raise Unavailable("Hermes respondió en un formato que no reconozco")


# ---------------- HTTP ----------------
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, data, status=200):
        payload = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/":
            self.path = "/demo/index.html"
        elif not (path.startswith("/demo/") or path.startswith("/src/")):
            return self.send_error(404)
        super().do_GET()

    def do_POST(self):
        path = self.path.split("?", 1)[0]
        if path not in ("/api/yayen/voz", "/api/yayen/hermes"):
            return self.send_error(404)
        if self.headers.get("X-Yayen") != "1":
            return self.send_json({"error": "Cabecera X-Yayen requerida"}, 403)
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(length)) if 0 < length <= 8192 else None
        except (ValueError, UnicodeDecodeError):
            body = None
        if not isinstance(body, dict) or not isinstance(body.get("text"), str):
            return self.send_json({"error": 'Se esperaba {"text": "…"}'}, 400)
        try:
            if path == "/api/yayen/hermes":
                return self.send_json({"reply": ask_hermes(body["text"])})
            data, kind = synthesize(body["text"])
        except ValueError as error:
            return self.send_json({"error": str(error)}, 400)
        except Unavailable as error:
            return self.send_json({"error": str(error)}, 503 if path.endswith("voz") else 502)
        self.send_response(200)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    print(f"Yayen en http://{HOST}:{PORT}  (voz: {'sí' if PIPER.exists() and MODEL.exists() else 'no instalada'}, "
          f"Hermes: {'configurado' if cfg('HERMES_URL') else 'sin configurar'})")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
