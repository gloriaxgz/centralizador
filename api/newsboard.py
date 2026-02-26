from flask import Flask, request, jsonify
import os
from upstash_redis import Redis

app = Flask(__name__)
redis = Redis(url=os.environ.get("KV_REST_API_URL"), token=os.environ.get("KV_REST_API_TOKEN"))

KEYS = {
    "rows": "newsboard_rows",
    "legend": "newsboard_legend",
    "pending": "newsboard_pending"
}

@app.route('/api/newsboard', methods=['GET', 'POST', 'DELETE'])
def newsboard():
    action = request.args.get('action')
    
    try:
        if action == 'pending':
            if request.method == 'GET':
                return jsonify(redis.get(KEYS["pending"]) or []), 200
            
            if request.method == 'POST':
                articles = request.json.get('articles', [])
                existing = redis.get(KEYS["pending"]) or []
                # Evita duplicatas
                urls_existentes = {a['url'] for a in existing}
                novos = [a for a in articles if a['url'] not in urls_existentes]
                merged = existing + novos
                redis.set(KEYS["pending"], merged)
                return jsonify({"ok": True, "count": len(merged)}), 200
            
            if request.method == 'DELETE':
                redis.set(KEYS["pending"], [])
                return jsonify({"ok": True}), 200

        # Fluxo principal (Rows/Legend)
        if request.method == 'GET':
            return jsonify({
                "rows": redis.get(KEYS["rows"]) or [],
                "legend": redis.get(KEYS["legend"]) or {}
            }), 200
            
        if request.method == 'POST':
            data = request.json
            if "rows" in data: redis.set(KEYS["rows"], data["rows"])
            if "legend" in data: redis.set(KEYS["legend"], data["legend"])
            return jsonify({"ok": True}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500