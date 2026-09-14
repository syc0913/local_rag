import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY","")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL","https://api.deepseek.com")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL","deepseek-v4-flash")

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "400"))
CHUNK_OVERLAP =int(os.getenv("CHUNK_OVERLAP", "100"))
RETRIEVAL_TOP_K =int(os.getenv("RETRIEVAL_TOP_K", "4"))

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DOCUMENTS_DIR = os.path.join(DATA_DIR,"documents")

os.makedirs(DATA_DIR, exist_ok=True)