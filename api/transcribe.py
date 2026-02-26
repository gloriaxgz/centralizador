import os
import requests
import uuid
import math
import hashlib
from flask import Flask, request, jsonify
from openai import OpenAI
from pydub import AudioSegment
from upstash_redis import Redis

app = Flask(__name__)

# Configurações de API
client = OpenAI(api_key=os.environ.get("OPENAI_KEY"))
redis = Redis(url=os.environ.get("KV_REST_API_URL"), token=os.environ.get("KV_REST_API_TOKEN"))

@app.route('/api/transcribe', methods=['POST'])
def transcribe_podcast():
    data = request.json
    audio_url = data.get('audioUrl')
    
    if not audio_url:
        return jsonify({"error": "URL do áudio não fornecida"}), 400

    # 1. Verificar Cache no Redis
    # Usamos um hash da URL como chave para evitar problemas com caracteres especiais
    cache_key = f"transcription:{hashlib.md5(audio_url.encode()).hexdigest()}"
    cached_text = redis.get(cache_key)

    if cached_text:
        print(f"Cache hit para: {audio_url}")
        return jsonify({"transcript": cached_text, "cached": True}), 200

    # Se não estiver no cache, começamos o processo...
    temp_id = str(uuid.uuid4())
    input_path = f"/tmp/{temp_id}_original.mp3"
    
    try:
        # 2. Download do áudio
        response = requests.get(audio_url, stream=True)
        with open(input_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        # 3. Carregar e Comprimir
        audio = AudioSegment.from_file(input_path)
        audio = audio.set_channels(1) # Mono
        
        chunk_length_ms = 15 * 60 * 1000 # 15 minutos
        total_length_ms = len(audio)
        chunks_count = math.ceil(total_length_ms / chunk_length_ms)
        
        full_transcript = []

        # 4. Transcrição por pedaços
        for i in range(chunks_count):
            start = i * chunk_length_ms
            end = min((i + 1) * chunk_length_ms, total_length_ms)
            
            chunk_path = f"/tmp/{temp_id}_part_{i}.mp3"
            audio[start:end].export(chunk_path, format="mp3", bitrate="32k")
            
            with open(chunk_path, "rb") as f:
                trans_res = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=f,
                    language="pt"
                )
                full_transcript.append(trans_res.text)
            
            os.remove(chunk_path) # Limpa pedaço

        final_text = " ".join(full_transcript)

        # 5. Salvar no Cache do Redis (expira em 30 dias para economizar espaço se desejar)
        # O padrão abaixo salva permanentemente
        redis.set(cache_key, final_text, ex=2592000)
        # Limpeza do arquivo original
        os.remove(input_path)

        return jsonify({"transcript": final_text, "cached": False}), 200

    except Exception as e:
        if os.path.exists(input_path): os.remove(input_path)
        return jsonify({"error": str(e)}), 500