import os
import requests
import uuid
import math
from flask import Flask, request, jsonify
from openai import OpenAI
from pydub import AudioSegment

app = Flask(__name__)
client = OpenAI(api_key=os.environ.get("OPENAI_KEY"))

@app.route('/api/transcribe', methods=['POST'])
def transcribe_podcast():
    data = request.json
    audio_url = data.get('audioUrl')
    
    if not audio_url:
        return jsonify({"error": "URL do áudio não fornecida"}), 400

    temp_id = str(uuid.uuid4())
    input_path = f"/tmp/{temp_id}_original.mp3"
    
    try:
        # 1. Download do áudio
        response = requests.get(audio_url, stream=True)
        with open(input_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        # 2. Carregar e Comprimir (Mono, 32k bitrate)
        audio = AudioSegment.from_file(input_path)
        audio = audio.set_channels(1) # Converter para Mono
        
        # Definir tempo de corte (ex: 15 minutos = 900.000 ms)
        chunk_length_ms = 15 * 60 * 1000 
        total_length_ms = len(audio)
        chunks_count = math.ceil(total_length_ms / chunk_length_ms)
        
        full_transcript = []

        # 3. Processar cada pedaço (Chunking)
        for i in range(chunks_count):
            start = i * chunk_length_ms
            end = min((i + 1) * chunk_length_ms, total_length_ms)
            
            chunk_path = f"/tmp/{temp_id}_part_{i}.mp3"
            chunk_audio = audio[start:end]
            
            # Exportar pedaço comprimido
            chunk_audio.export(chunk_path, format="mp3", bitrate="32k")
            
            # Enviar para Whisper
            with open(chunk_path, "rb") as f:
                response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=f,
                    language="pt"
                )
                full_transcript.append(response.text)
            
            # Limpar pedaço após uso
            os.remove(chunk_path)

        # 4. Limpeza do arquivo original
        os.remove(input_path)

        # Retornar texto completo concatenado
        return jsonify({"transcript": " ".join(full_transcript)}), 200

    except Exception as e:
        if os.path.exists(input_path): os.remove(input_path)
        return jsonify({"error": str(e)}), 500