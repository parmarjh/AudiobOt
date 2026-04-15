import { useState, useEffect, useRef, useCallback } from "react";

const LANGUAGES = [
  { code: "en-US", label: "English (US)", flag: "🇺🇸" },
  { code: "hi-IN", label: "Hindi", flag: "🇮🇳" },
  { code: "es-ES", label: "Spanish", flag: "🇪🇸" },
  { code: "fr-FR", label: "French", flag: "🇫🇷" },
  { code: "ja-JP", label: "Japanese", flag: "🇯🇵" },
];

const SAMPLE_PROMPTS = ["Tell me about the document", "Summarize the key points", "Explain the main concept"];

export default function VoiceAgent() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "agent",
      text: "God Mode Activated. I am your high-performance AI Core. Feed me data (Files/Links) and I will process them with absolute precision.",
      lang: "en-US",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [waveform, setWaveform] = useState(Array(30).fill(4));
  const [transcript, setTranscript] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [sourceStatus, setSourceStatus] = useState("No Data Loaded");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [urlType, setUrlType] = useState("web");

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const messagesEndRef = useRef(null);
  const waveformInterval = useRef(null);
  const fileInputRef = useRef(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = synthRef.current.getVoices();
      setVoices(allVoices);
    };
    loadVoices();
    synthRef.current.onvoiceschanged = loadVoices;
  }, []);

  // Filter voices
  useEffect(() => {
    const langCode = selectedLang.split("-")[0].toLowerCase();
    const filtered = voices.filter((v) => v.lang.toLowerCase().startsWith(langCode));
    setAvailableVoices(filtered);
    setSelectedVoice(filtered[0] || null);
  }, [voices, selectedLang]);

  // Premium Waveform
  const startWaveform = useCallback(() => {
    waveformInterval.current = setInterval(() => {
      setWaveform(Array(30).fill(0).map(() => Math.random() * 45 + 5));
    }, 60);
  }, []);

  const stopWaveform = useCallback(() => {
    clearInterval(waveformInterval.current);
    setWaveform(Array(30).fill(4));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = useCallback((text) => {
    synthRef.current.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utter.voice = selectedVoice;
    utter.lang = selectedLang;
    utter.pitch = pitch;
    utter.rate = rate;
    utter.onstart = () => { setIsSpeaking(true); startWaveform(); };
    utter.onend = () => { setIsSpeaking(false); stopWaveform(); };
    utter.onerror = () => { setIsSpeaking(false); stopWaveform(); };
    synthRef.current.speak(utter);
  }, [selectedVoice, selectedLang, pitch, rate, startWaveform, stopWaveform]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      stopWaveform();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech Recognition not supported.");
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = selectedLang;
    recognition.interimResults = true;
    recognition.onstart = () => { setIsListening(true); setTranscript(""); startWaveform(); };
    recognition.onresult = (e) => {
      const t = Array.from(e.results).map((r) => r[0].transcript).join("");
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) { setInputText(t); setTranscript(""); }
    };
    recognition.onend = () => { setIsListening(false); stopWaveform(); };
    recognition.start();
  }, [isListening, selectedLang, startWaveform, stopWaveform]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const resp = await fetch("http://localhost:8000/upload", { method: "POST", body: formData });
      const data = await resp.json();
      if (data.status === "success") {
        setSourceStatus("Core Synchronized");
        setSourceName(file.name);
        setMessages(prev => [...prev, { id: Date.now(), role: "agent", text: `DATAFRAME LOADED: "${file.name}". Neural pathing established. Systems ready for query.`, lang: selectedLang }]);
      }
    } finally { setIsLoading(false); }
  };

  const handleUrlSubmit = async () => {
    if (!sourceUrl.trim()) return;
    setIsLoading(true);
    try {
      const resp = await fetch("http://localhost:8000/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sourceUrl, type: urlType }),
      });
      const data = await resp.json();
      if (data.status === "success") {
        setSourceStatus("Network Data Synced");
        setSourceName(urlType === "wiki" ? `Wiki: ${sourceUrl}` : "Remote URL");
        setMessages(prev => [...prev, { id: Date.now(), role: "agent", text: `LINK INJECTED: Source verified and indexed. Standing by.`, lang: selectedLang }]);
        setSourceUrl("");
      }
    } finally { setIsLoading(false); }
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;
    setMessages(prev => [...prev, { id: Date.now(), role: "user", text, lang: selectedLang }]);
    setInputText("");
    setIsLoading(true);
    try {
      const resp = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await resp.json();
      const agentMsg = { id: Date.now() + 1, role: "agent", text: data.reply, lang: selectedLang };
      setMessages(prev => [...prev, agentMsg]);
      speak(data.reply);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="god-mode-container" style={{
      minHeight: "100vh", background: "#050505", color: "#fff",
      fontFamily: "'Inter', system-ui, sans-serif", display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      {/* HUD Background */}
      <div className="hud-overlay" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, border: "20px solid rgba(0, 255, 255, 0.05)", mixBlendMode: "screen" }} />
      <div className="gradient-glow" style={{ position: "fixed", top: "-10%", left: "-10%", width: "40%", height: "40%", background: "radial-gradient(circle, rgba(0,255,170,0.15) 0%, transparent 70%)", filter: "blur(60px)", zIndex: 0 }} />
      <div className="gradient-glow-2" style={{ position: "fixed", bottom: "-10%", right: "-10%", width: "40%", height: "40%", background: "radial-gradient(circle, rgba(0,170,255,0.1) 0%, transparent 70%)", filter: "blur(60px)", zIndex: 0 }} />

      {/* Main UI */}
      <header style={{ position: "relative", zIndex: 10, padding: "20px 40px", borderBottom: "1px solid rgba(0,255,255,0.1)", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <div className={`core-orb ${isListening || isSpeaking ? 'active' : ''}`} />
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 4, color: "#00ffaa", textShadow: "0 0 15px rgba(0,255,170,0.5)" }}>GOD MODE</div>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: 5 }}>NEURAL ENGINE v4.0</div>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div className="status-badge">
             <div className="status-dot" style={{ background: isLoading ? "#ffaa00" : "#00ffaa" }} />
             {isLoading ? "PROCESSING" : "READY"}
          </div>
          <a href="https://github.com/parmarjh/Audio-chatbot-pdf" target="_blank" rel="noreferrer" className="control-btn" title="GitHub Repository">
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
          </a>
          <a href="https://github.com/parmarjh/Audio-chatbot-pdf#contributions" target="_blank" rel="noreferrer" className="action-btn" style={{ fontSize: 10, padding: "5px 10px" }}>CONTRIBUTION</a>
          <button onClick={() => setShowSettings(!showSettings)} className="control-btn gear">⚙️</button>
        </div>
      </header>

      {/* Settings HUD */}
      {showSettings && (
        <div className="settings-hud" style={{ position: "relative", zIndex: 10, padding: "20px 40px", background: "rgba(5,15,25,0.95)", borderBottom: "1px solid #00ffaa33", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 30 }}>
            <div>
                <label style={{ fontSize: 10, color: "#00ffaa", letterSpacing: 2 }}>DATA INJECTION</label>
                <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                    <button onClick={() => fileInputRef.current.click()} className="action-btn">FILE</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} hidden />
                    <select value={urlType} onChange={(e) => setUrlType(e.target.value)} className="hud-select">
                        <option value="web">WEB</option>
                        <option value="wiki">WIKI</option>
                    </select>
                    <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="SOURCE LINK..." className="hud-input" />
                    <button onClick={handleUrlSubmit} className="action-btn cyan">LINK</button>
                </div>
            </div>
            <div>
                <label style={{ fontSize: 10, color: "#00ffaa", letterSpacing: 2 }}>LANGUAGE MODULE</label>
                <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className="hud-select-full">
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
                </select>
            </div>
        </div>
      )}

      {/* Chat Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 40px", position: "relative", zIndex: 5 }}>
        <div className="message-container" style={{ flex: 1, overflowY: "auto", paddingRight: "10px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {messages.map(m => (
            <div key={m.id} className={`msg-wrapper ${m.role}`}>
                <div className="msg-content">
                  {m.text}
                </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>


        {/* HUD Visualizer */}
        <div className="hud-visualizer" style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
           {waveform.map((h, i) => (
             <div key={i} className="wave-bar" style={{ height: h, background: isListening ? "#ff4444" : "#00ffaa" }} />
           ))}
        </div>

        {/* Input Dock */}
        <div style={{ marginTop: 10, position: "relative" }}>
          {transcript && <div className="transcript-float">{transcript}</div>}
          <div className="input-dock">
            <input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="COMMAND INPUT..." className="main-input" />
            <button onClick={toggleListening} className={`mic-btn ${isListening ? 'listening' : ''}`}>🎤</button>
            <button onClick={sendMessage} className="send-btn">➤</button>
          </div>
        </div>
      </main>

      <style>{`
        .core-orb { width: 40px; height: 40px; border-radius: 50%; background: #00ffaa; box-shadow: 0 0 20px rgba(0,255,170,0.8); }
        .core-orb.active { animation: pulseCore 1s infinite alternate; }
        @keyframes pulseCore { from { transform: scale(1); box-shadow: 0 0 20px rgba(0,255,170,0.8); } to { transform: scale(1.1); box-shadow: 0 0 40px rgba(0,255,170,1); } }
        
        .status-badge { background: rgba(0,0,0,0.5); padding: 5px 12px; border-radius: 20px; font-size: 10px; font-weight: bold; border: 1px solid rgba(255,255,255,0.1); display: flex; alignItems: center; gap: 8px; }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; }
        
        .control-btn { background: none; border: 1px solid rgba(255,255,255,0.1); color: #888; width: 40px; height: 40px; border-radius: 8px; cursor: pointer; display: flex; alignItems: center; justifyContent: center; }
        .control-btn:hover { border-color: #00ffaa; color: #00ffaa; }

        .action-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: bold; }
        .action-btn.cyan { border-color: #00ffaa; color: #00ffaa; }
        .action-btn:hover { background: rgba(0,255,170,0.1); }

        .hud-select, .hud-input, .hud-select-full { background: #000; border: 1px solid #333; color: #eee; padding: 8px; border-radius: 6px; font-size: 11px; outline: none; }
        .hud-input { flex: 1; }
        .hud-select-full { width: 100%; margin-top: 10px; }

        .msg-wrapper.agent { align-self: flex-start; }
        .msg-wrapper.user { align-self: flex-end; }
        .msg-content { padding: 15px 20px; border-radius: 12px; font-size: 14px; max-width: 80%; line-height: 1.5; }
        .agent .msg-content { background: rgba(0,255,170,0.05); border-left: 4px solid #00ffaa; }
        .user .msg-content { background: rgba(255,255,255,0.05); border-right: 4px solid #fff; text-align: right; }
        .msg-sub { font-size: 9px; color: #00ffaa88; margin-top: 5px; font-weight: bold; border-top: 1px solid rgba(0,255,170,0.1); padding-top: 4px; }

        .wave-bar { width: 4px; border-radius: 2px; transition: height 0.08s ease; }
        
        .input-dock { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px; border-radius: 12px; display: flex; gap: 10px; alignItems: center; backdrop-filter: blur(10px); }
        .main-input { flex: 1; background: none; border: none; color: #fff; padding: 10px; font-family: inherit; font-size: 14px; outline: none; }
        .mic-btn, .send-btn { width: 44px; height: 44px; border-radius: 10px; border: none; cursor: pointer; display: flex; alignItems: center; justifyContent: center; }
        .mic-btn { background: rgba(255,255,255,0.1); color: #fff; font-size: 18px; }
        .mic-btn.listening { background: #ff4444; animation: glowRed 1s infinite alternate; }
        @keyframes glowRed { from { box-shadow: 0 0 5px #ff4444; } to { box-shadow: 0 0 20px #ff4444; } }
        .send-btn { background: #00ffaa; color: #000; font-size: 18px; }

        .transcript-float { position: absolute; bottom: 70px; left: 0; right: 0; background: rgba(0,0,0,0.8); padding: 10px; border-radius: 8px; font-size: 13px; color: #00ffaa; text-align: center; border: 1px solid #00ffaa44; font-style: italic; pointer-events: none; }

        .message-container::-webkit-scrollbar { width: 4px; }
        .message-container::-webkit-scrollbar-thumb { background: rgba(0, 255, 170, 0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}
