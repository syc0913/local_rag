import json
import os
import uuid
from datetime import datetime
from config import DATA_DIR

SEEIONS_DIR = os.path.join(DATA_DIR,"sessions")

DOCSTORE_PATH = os.path.join(DATA_DIR, "docstore.json")

os.makedirs(SEEIONS_DIR,exist_ok=True)


def _load_json(path,default=None):
    if os.path.exists(path):
        with open(path,"r",encoding="utf-8") as f:
            return json.load(f)
    return default if default is not None else {}

def _save_json(path,data):
    with open(path,"w",encoding="utf-8") as f:
        json.dump(data,f,ensure_ascii=False,indent=2)


def get_session_path(session_id):
    return os.path.join(SEEIONS_DIR,f"{session_id}.json")

def create_session(title=""):
    session_id = str(uuid.uuid4())[:8]
    session={
        "id":session_id,
        "title":title or f"会话{session_id}",
        "created_at":datetime.now().isoformat(),
        "messages":[],
    }
    _save_json(get_session_path(session_id),session)
    return session


def get_session(session_id):
    path = get_session_path(session_id)
    if not os.path.exists(path):
        return None
    return _load_json(path)

def save_session(session):
    _save_json(get_session_path(session["id"]),session)

def list_sessions():
    sessions = []
    if not os.path.exists(SEEIONS_DIR):
        return sessions
    for fname in os.listdir(SEEIONS_DIR):
        if fname.endswith(".json"):
            s = _load_json(os.path.join(SEEIONS_DIR,fname))
            if s:
                sessions.append({
                    "id":s["id"],
                    "title":s["title"],
                    "created_at":s["created_at"],
                    "message_count":len(s.get("messages",[])),
                })
    sessions.sort(key=lambda x:x["created_at"],reverse=True)
    return sessions

def delete_session(session_id):
    path = get_session_path(session_id)
    if os.path.exists(path):
        os.remove(path)
        return True
    return False


def get_docstore():
    return _load_json(DOCSTORE_PATH, {"documents": {}, "chunks": []})


def save_docstore(docstore):
    _save_json(DOCSTORE_PATH, docstore)


def add_document(filename,chunks):
    """添加一个文档及其所有 chunk。chunks 是列表，每项 = {text, embedding}"""
    ds = get_docstore()
    doc_id = str(uuid.uuid4())[:8]
    ds["documents"][doc_id] = {
        "filename":filename,
        "chunk_count":len(chunks),
        "uploaded_at":datetime.now().isoformat(),
    }
    for i,chunk in enumerate(chunks):
        ds["chunks"].append({
            "doc_id":doc_id,
            "filename":filename,
            "chunk_index":i,
            "text":chunk["text"],
            "embedding":chunk["embedding"],
        })
    save_docstore(ds)
    return doc_id

def remove_document(filename):
    """按文件名删除文档及其所有 chunk"""
    ds = get_docstore()
    ds["chunks"] = [c for c in ds["chunks"] if c["filename"] != filename]
    ds["documents"] = {k: v for k, v in ds["documents"].items() if v["filename"] != filename}
    save_docstore(ds)


def list_documents():
    """列出所有已入库的文档"""
    ds = get_docstore()
    return list(ds["documents"].values())


def get_all_chunks():
    """获取全部 chunk，供检索使用"""
    ds = get_docstore()
    return ds["chunks"]
