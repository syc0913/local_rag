(function () {
    const API = "/api";

    let state = {
        sessions: [],
        activeSessionId: null,
        streamingAbort: null,
    };

    const $ = (sel) => document.querySelector(sel);

    const sessionList = $("#session-list");
    const messagesEl = $("#messages");
    const userInput = $("#user-input");
    const btnSend = $("#btn-send");
    const btnNew = $("#btn-new-session");
    const sessionTitle = $("#current-session-title");
    const docList = $("#doc-list");
    const fileInput = $("#file-input");
    const uploadStatus = $("#upload-status");

    async function api(method, path, body) {
        const opts = {
            method,
            headers: { "Content-Type": "application/json" },
        };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(API + path, opts);
        return res.json();
    }

    async function loadSessions() {
        state.sessions = await api("GET", "/sessions");
        renderSessions();
    }

    function renderSessions() {
        sessionList.innerHTML = "";
        state.sessions.forEach((s) => {
            const li = document.createElement("li");
            li.dataset.id = s.id;
            if (s.id === state.activeSessionId) li.classList.add("active");

            const span = document.createElement("span");
            span.textContent = s.title || "未命名";
            span.style.flex = "1";
            span.onclick = () => switchSession(s.id);

            const del = document.createElement("span");
            del.className = "del-session";
            del.textContent = "×";
            del.onclick = (e) => {
                e.stopPropagation();
                deleteSession(s.id);
            };

            li.appendChild(span);
            li.appendChild(del);
            sessionList.appendChild(li);
        });
    }

    async function switchSession(id) {
        state.activeSessionId = id;
        const sess = await api("GET", "/sessions/" + id);
        messagesEl.innerHTML = "";
        if (sess && sess.messages) {
            sess.messages.forEach((m) => addMessage(m.role, m.content));
        }
        sessionTitle.textContent = sess ? sess.title : "Mini-RAG";
        scrollBottom();
        btnSend.disabled = false;
        renderSessions();
    }

    async function deleteSession(id) {
        await api("DELETE", "/sessions/" + id);
        if (state.activeSessionId === id) {
            state.activeSessionId = null;
            messagesEl.innerHTML = "";
            sessionTitle.textContent = "选择一个会话";
            btnSend.disabled = true;
        }
        await loadSessions();
    }

    function addMessage(role, content, idHint) {
        const div = document.createElement("div");
        div.className = `message ${role}`;
        if (idHint) div.id = idHint;
        div.textContent = content;
        messagesEl.appendChild(div);
        scrollBottom();
        return div;
    }

    function scrollBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    /* ─── Documents ─── */
    async function loadDocuments() {
        const docs = await api("GET", "/documents");
        docList.innerHTML = "";
        docs.forEach((d) => {
            const li = document.createElement("li");
            li.innerHTML = `<span>${d.filename} (${d.chunk_count}块)</span>`;
            const del = document.createElement("span");
            del.className = "del-doc";
            del.textContent = "×";
            del.onclick = async () => {
                await api("DELETE", "/documents/" + encodeURIComponent(d.filename));
                loadDocuments();
            };
            li.appendChild(del);
            docList.appendChild(li);
        });
    }

    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;
        uploadStatus.textContent = "上传中...";
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(API + "/documents/upload", { method: "POST", body: form });
        const data = await res.json();
        uploadStatus.textContent = data.error ? "上传失败" : "上传完成";
        fileInput.value = "";
        setTimeout(() => { uploadStatus.textContent = ""; }, 2000);
        loadDocuments();
    });


    async function sendMessage() {
        const query = userInput.value.trim();
        if (!query) return;

        // 没有活跃会话时自动创建
        if (!state.activeSessionId) {
            const sess = await api("POST", "/sessions");
            state.activeSessionId = sess.id;
            sessionTitle.textContent = sess.title;
            await loadSessions();
        }

        addMessage("user", query);
        userInput.value = "";
        userInput.style.height = "auto";

        // 创建一个占位机器人气泡
        const botDiv = addMessage("assistant", "思考中...", "streaming-msg");
        btnSend.disabled = true;

        const ctrl = new AbortController();
        state.streamingAbort = ctrl;

        try {
            const res = await fetch(API + "/chat/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: query,
                    session_id: state.activeSessionId,
                }),
                signal: ctrl.signal,
            });

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let started = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop();  // 保留未完成的行

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const raw = line.slice(6).trim();
                    if (!raw || raw === "[DONE]") continue;

                    try {
                        const data = JSON.parse(raw);
                        if (data.type === "content") {
                            if (!started) {
                                botDiv.textContent = "";
                                started = true;
                            }
                            botDiv.textContent += data.text;
                            scrollBottom();
                        } else if (data.type === "error") {
                            if (!started) {
                                botDiv.textContent = "";
                                started = true;
                            }
                            botDiv.textContent += `[错误: ${data.message}]`;
                        } else if (data.type === "meta") {
                            // 检索元信息，不渲染文本
                        }
                    } catch (e) { }
                }
            }

            if (!started) botDiv.textContent = "(已终止回答)";
        } catch (err) {
            if (err.name === "AbortError") {
                botDiv.textContent += "\n(已终止回答)";
            } else {
                botDiv.textContent = `请求失败: ${err.message}`;
            }
        } finally {
            state.streamingAbort = null;
            btnSend.disabled = false;
            botDiv.removeAttribute("id");
        }
    }




    btnNew.addEventListener("click", async () => {
        const sess = await api("POST", "/sessions");
        state.activeSessionId = sess.id;
        messagesEl.innerHTML = "";
        sessionTitle.textContent = sess.title;
        btnSend.disabled = false;
        await loadSessions();
    });

    btnSend.addEventListener("click", sendMessage);

    userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!btnSend.disabled) sendMessage();
        }
    });

    userInput.addEventListener("input", () => {
        userInput.style.height = "auto";
        userInput.style.height = Math.min(userInput.scrollHeight, 200) + "px";
    });


    async function init() {
        await loadSessions();
        await loadDocuments();
    }

    init();

})()