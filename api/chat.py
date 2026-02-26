from flask import Flask, request, jsonify
import os
from openai import OpenAI

app = Flask(__name__)
client = OpenAI(api_key=os.environ.get("OPENAI_KEY"))

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    messages = data.get('messages', [])
    temp = data.get('temperature', 0.5)
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=temp
        )
        return jsonify({"content": response.choices[0].message.content}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500