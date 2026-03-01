import os
import math
import uuid
import hashlib
import requests
from flask import Flask, request, jsonify
from openai import OpenAI
from upstash_redis import Redis

app = Flask(__name__)

client = OpenAI(api_key=os.environ.get("OPENAI_KEY"))
redis  = Redis(url=os.environ.get("KV_REST_API_URL"), token=os.environ.get("KV_REST_API_TOKEN"))

# Whisper aceita até 25 MB por requisição
WHISPER_LIMIT_BYTES = 24 * 1024 * 1024  # 24 MB com margem de segurança


@app.route('/api/transcribe', methods=['POST'])
def transcribe_podcast():
    data      = request.json or {}
    audio_url = data.get('audioUrl', '').strip()

    if not audio_url:
        return jsonify({"error": "URL do áudio não fornecida"}), 400

    # ── 1. Cache ──────────────────────────────────────────────────────────────
    cache_key   = f"transcription:{hashlib.md5(audio_url.encode()).hexdigest()}"
    cached_text = redis.get(cache_key)
    if cached_text:
        return jsonify({"transcript": cached_text, "cached": True}), 200

    temp_id    = str(uuid.uuid4())
    input_path = f"/tmp/{temp_id}_original.mp3"

    try:
        # ── 2. Download ───────────────────────────────────────────────────────
        resp = requests.get(audio_url, stream=True, timeout=120,
                            headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()

        with open(input_path, 'wb') as f:
            for chunk in resp.iter_content(chunk_size=65536):
                f.write(chunk)

        file_size = os.path.getsize(input_path)

        # ── 3. Transcrição ────────────────────────────────────────────────────
        # Arquivo cabe em uma única requisição → envia direto, sem chunking
        if file_size <= WHISPER_LIMIT_BYTES:
            with open(input_path, "rb") as f:
                result = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=f,
                    language="pt"
                )
            final_text = result.text

        # Arquivo grande → divide em pedaços por bytes
        # MP3 é orientado a frames: cortar nos bytes raramente causa problema
        # perceptível para transcrição (o Whisper é robusto a isso).
        else:
            num_chunks  = math.ceil(file_size / WHISPER_LIMIT_BYTES)
            chunk_size  = math.ceil(file_size / num_chunks)
            transcripts = []

            with open(input_path, 'rb') as src:
                for i in range(num_chunks):
                    chunk_path = f"/tmp/{temp_id}_part_{i}.mp3"
                    chunk_data = src.read(chunk_size)
                    if not chunk_data:
                        break
                    with open(chunk_path, 'wb') as cf:
                        cf.write(chunk_data)
                    try:
                        with open(chunk_path, 'rb') as cf:
                            res = client.audio.transcriptions.create(
                                model="whisper-1",
                                file=cf,
                                language="pt"
                            )
                            transcripts.append(res.text)
                    finally:
                        if os.path.exists(chunk_path):
                            os.remove(chunk_path)

            final_text = " ".join(transcripts)

        # ── 4. Cache (30 dias) ────────────────────────────────────────────────
        redis.set(cache_key, final_text, ex=2592000)

        return jsonify({"transcript": final_text, "cached": False}), 200

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Falha no download do áudio: {str(e)}"}), 502

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if os.path.exists(input_path):
            os.remove(input_path)