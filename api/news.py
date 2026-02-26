from flask import Flask, request, jsonify
import os
import time
import requests
from upstash_redis import Redis

app = Flask(__name__)

# Configuração do Redis (Vercel KV)
redis = Redis(url=os.environ.get("KV_REST_API_URL"), token=os.environ.get("KV_REST_API_TOKEN"))

@app.route('/api/news', methods=['GET'])
def get_news():
    gnews_key = os.environ.get("GNEWS_KEY")
    query = '("Artificial Intelligence" OR "Generative AI" OR "NVIDIA" OR "OpenAI")'
    force_update = request.args.get('force') == 'true'
    
    try:
        agora = int(time.time() * 1000)
        ciclo_ms = 15 * 24 * 60 * 60 * 1000
        
        inicio_ciclo = redis.get('ciclo_inicio_timestamp')
        
        # 1. Controle de Ciclo
        if not inicio_ciclo or (agora - int(inicio_ciclo) > ciclo_ms):
            redis.set('noticias_globais', [])
            redis.set('ciclo_inicio_timestamp', agora)
            history = []
        else:
            history = redis.get('noticias_globais') or []

        # 2. Busca GNews
        if force_update or not history:
            url = f"https://gnews.io/api/v4/search?q={query}&lang=en&country=us&max=20&sortby=publishedAt&token={gnews_key}"
            response = requests.get(url)
            data = response.json()
            
            if "articles" in data:
                novas = [a for a in data["articles"] if not any(h['url'] == a['url'] for h in history)]
                history = novas + history
                redis.set('noticias_globais', history)

        return jsonify(history), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500