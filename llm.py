import os
from openai import OpenAI
import config

_client = None

def get_client():
    global _client
    if _client is None:
        key = config.DEEPSEEK_API_KEY
        if not key:
            raise RuntimeError("DEEPSEEK_API_KEY 未配置，请先创建env,在填入Deepseek api key")
        _client = OpenAI(api_key=key,base_url=config.DEEPSEEK_BASE_URL)
    return _client

def chat_stream(messages):
    stream = get_client().chat.completions.create(
        model = config.DEEPSEEK_MODEL,
        messages = messages,
        stream = True,
        temperature = 0.7,
        max_tokens = 2048,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content


