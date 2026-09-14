# Mini-RAG

一个基于 Flask、TF-IDF 和 DeepSeek API 的本地知识库问答应用。

## 功能

- 上传 `.txt`、`.md`、`.json`、`.csv` 文档并建立本地检索索引
- 使用 TF-IDF 与余弦相似度召回相关文本片段
- 结合检索内容和 DeepSeek 模型进行流式问答
- 保存、切换和删除本地会话
- 删除已上传的文档及其索引数据

## 项目结构

```text
.
├── app.py              # Flask 路由与 SSE 流式聊天接口
├── config.py           # 环境变量与运行配置
├── llm.py              # DeepSeek/OpenAI 兼容客户端
├── rag.py              # 文本分块、向量化与检索
├── storage.py          # 文档和会话的本地持久化
├── chat.py             # 命令行聊天入口
├── static/             # Web 前端资源
└── requirements.txt
```

## 本地运行

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

在 `.env` 中填写 DeepSeek API Key：

```dotenv
DEEPSEEK_API_KEY=your_deepseek_api_key
```

启动 Web 应用：

```powershell
python app.py
```

浏览器访问 `http://127.0.0.1:8000`。

也可以在终端运行基础对话程序：

```powershell
python chat.py
```

## 配置项

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 空 | DeepSeek API Key，必填 |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | API 基础地址 |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` | 使用的模型名称 |
| `CHUNK_SIZE` | `400` | 单段文本长度 |
| `CHUNK_OVERLAP` | `100` | 相邻文本段的重叠长度 |
| `RETRIEVAL_TOP_K` | `4` | 每次检索返回的文本段数量 |

## 数据说明

上传的文档、向量索引和会话记录默认保存在 `data/` 目录中。该目录已加入 `.gitignore`，不会提交到 Git 仓库。
