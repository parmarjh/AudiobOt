import { useState, useEffect, useRef, useCallback } from "react";

const LANGUAGES = [
  { code: "en-US", label: "English (US)", flag: "🇺🇸" },
  { code: "en-GB", label: "English (UK)", flag: "🇬🇧" },
  { code: "hi-IN", label: "Hindi", flag: "🇮🇳" },
  { code: "es-ES", label: "Spanish", flag: "🇪🇸" },
  { code: "fr-FR", label: "French", flag: "🇫🇷" },
  { code: "de-DE", label: "German", flag: "🇩🇪" },
  { code: "ja-JP", label: "Japanese", flag: "🇯🇵" },
  { code: "zh-CN", label: "Chinese", flag: "🇨🇳" },
  { code: "ar-SA", label: "Arabic", flag: "🇸🇦" },
  { code: "pt-BR", label: "Portuguese", flag: "🇧🇷" },
];

const VOICE_GENDER = ["Female", "Male", "Auto"];

const SAMPLE_PROMPTS = {
  "en-US": ["Explain quantum computing", "Tell me a joke", "What is AI?"],
  "hi-IN": ["AI क्या है?", "मौसम कैसा है?", "एक कहानी सुनाओ"],
  "es-ES": ["¿Qué es la IA?", "Cuéntame un chiste", "Explica la ciencia"],
  "fr-FR": ["Qu'est-ce que l'IA?", "Raconte une blague", "Explique la science"],
  "de-DE": ["Was ist KI?", "Erzähl einen Witz", "Erkläre die Wissenschaft"],
  "ja-JP": ["AIとは何ですか？", "冗談を言って", "科学を説明して"],
  "zh-CN": ["什么是人工智能？", "讲个笑话", "解释科学"],
};

export default function VoiceAgent() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "agent",
      text: "Hello! I'm your AI Voice Agent. Select your language and voice gender, then speak or type to begin.",
      lang: "en-US",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [gender, setGender] = useState("Female");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [waveform, setWaveform] = useState(Array(20).fill(4));
  const [transcript, setTranscript] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [pdfText, setPdfText] = useState("");
  const [pdfName, setPdfName] = useState("");

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

  // Filter voices by language + gender
  useEffect(() => {
    const langCode = selectedLang.split("-")[0].toLowerCase();
    const filtered = voices.filter((v) => {
      const vLang = v.lang.toLowerCase();
      return vLang.startsWith(langCode) || vLang.startsWith(selectedLang.toLowerCase());
    });

    let genderFiltered = filtered;
    if (gender !== "Auto" && filtered.length > 1) {
      const genderKey = gender.toLowerCase();
      const gMatches = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(genderKey) ||
          (genderKey === "female" && (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Victoria") || v.name.includes("Zira") || v.name.includes("Aria"))) ||
          (genderKey === "male" && (v.name.includes("David") || v.name.includes("Daniel") || v.name.includes("Alex") || v.name.includes("Mark") || v.name.includes("James")))
      );
      if (gMatches.length > 0) genderFiltered = gMatches;
    }

    setAvailableVoices(filtered);
    setSelectedVoice(genderFiltered[0] || filtered[0] || null);
  }, [voices, selectedLang, gender]);

  // Waveform animation
  const startWaveform = useCallback(() => {
    waveformInterval.current = setInterval(() => {
      setWaveform(Array(20).fill(0).map(() => Math.random() * 32 + 4));
    }, 80);
  }, []);

  const stopWaveform = useCallback(() => {
    clearInterval(waveformInterval.current);
    setWaveform(Array(20).fill(4));
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speak text
  const speak = useCallback(
    (text) => {
      synthRef.current.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      if (selectedVoice) utter.voice = selectedVoice;
      utter.lang = selectedLang;
      utter.pitch = pitch;
      utter.rate = rate;
      utter.volume = volume;

      utter.onstart = () => {
        setIsSpeaking(true);
        startWaveform();
      };
      utter.onend = () => {
        setIsSpeaking(false);
        stopWaveform();
      };
      utter.onerror = () => {
        setIsSpeaking(false);
        stopWaveform();
      };
      synthRef.current.speak(utter);
    },
    [selectedVoice, selectedLang, pitch, rate, volume, startWaveform, stopWaveform]
  );

  // Stop speaking
  const stopSpeaking = () => {
    synthRef.current.cancel();
    setIsSpeaking(false);
    stopWaveform();
  };

  // STT
  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      stopWaveform();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = selectedLang;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      startWaveform();
    };
    recognition.onresult = (e) => {
      const t = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) {
        setInputText(t);
        setTranscript("");
      }
    };
    recognition.onend = () => {
      setIsListening(false);
      stopWaveform();
    };
    recognition.onerror = () => {
      setIsListening(false);
      stopWaveform();
    };
    recognition.start();
  }, [isListening, selectedLang, startWaveform, stopWaveform]);

  // PDF Upload
  const handlePDFUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Basic text extraction for .txt; for PDF we get raw
      const text = ev.target.result;
      setPdfText(text.slice(0, 8000));
    };
    reader.readAsText(file);
  };

  // Send message
  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    const userMsg = { id: Date.now(), role: "user", text, lang: selectedLang };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const langLabel = LANGUAGES.find((l) => l.code === selectedLang)?.label || selectedLang;
      const systemPrompt = `You are a helpful multilingual AI voice assistant. 
Always respond in ${langLabel} language (${selectedLang}).
Keep responses concise (2-3 sentences max) since they will be spoken aloud.
Be natural and conversational.
${pdfText ? `\nContext from uploaded document:\n${pdfText.slice(0, 3000)}` : ""}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: text }],
        }),
      });

      const data = await response.json();
      const replyText = data.content?.[0]?.text || "Sorry, I couldn't process that.";

      const agentMsg = { id: Date.now() + 1, role: "agent", text: replyText, lang: selectedLang };
      setMessages((prev) => [...prev, agentMsg]);
      speak(replyText);
    } catch (err) {
      const errMsg = { id: Date.now() + 1, role: "agent", text: "Error connecting to AI. Please try again.", lang: "en-US" };
      setMessages((prev) => [...prev, errMsg]);
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const langInfo = LANGUAGES.find((l) => l.code === selectedLang);
  const prompts = SAMPLE_PROMPTS[selectedLang] || SAMPLE_PROMPTS["en-US"];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0f1a 100%)",
      fontFamily: "'Courier New', Courier, monospace",
      color: "#e0e0e0",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Animated background grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: "linear-gradient(rgba(0,255,170,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,170,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <header style={{
        position: "relative", zIndex: 10,
        borderBottom: "1px solid rgba(0,255,170,0.15)",
        padding: "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "conic-gradient(#00ffaa, #00aaff, #ff00aa, #00ffaa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: isSpeaking ? "spin 2s linear infinite" : "none",
          }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎙️</div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#00ffaa", letterSpacing: 2 }}>VOICE AGENT</div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 3 }}>MULTILINGUAL · ADAPTIVE AI</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Language selector */}
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            style={{
              background: "rgba(0,255,170,0.05)", border: "1px solid rgba(0,255,170,0.2)",
              color: "#00ffaa", padding: "6px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer",
              outline: "none",
            }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} style={{ background: "#0d1117" }}>
                {l.flag} {l.label}
              </option>
            ))}
          </select>

          {/* Gender toggle */}
          <div style={{ display: "flex", gap: 2, background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: 3, border: "1px solid rgba(0,255,170,0.1)" }}>
            {VOICE_GENDER.map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 11, border: "none", cursor: "pointer",
                  background: gender === g ? (g === "Female" ? "linear-gradient(135deg,#ff66aa,#cc44aa)" : g === "Male" ? "linear-gradient(135deg,#4488ff,#2244cc)" : "linear-gradient(135deg,#00ffaa,#00aa77)") : "transparent",
                  color: gender === g ? "#fff" : "#555",
                  fontWeight: gender === g ? "bold" : "normal",
                  transition: "all 0.2s",
                }}
              >
                {g === "Female" ? "♀ F" : g === "Male" ? "♂ M" : "⚡ A"}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: showSettings ? "rgba(0,255,170,0.15)" : "transparent",
              border: "1px solid rgba(0,255,170,0.2)", color: "#00ffaa",
              width: 34, height: 34, borderRadius: 8, cursor: "pointer", fontSize: 14,
            }}
          >⚙️</button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{
          position: "relative", zIndex: 10,
          background: "rgba(0,10,20,0.95)", borderBottom: "1px solid rgba(0,255,170,0.1)",
          padding: "16px 24px", display: "flex", gap: 32, flexWrap: "wrap",
        }}>
          {[
            { label: "PITCH", value: pitch, set: setPitch, min: 0.5, max: 2, step: 0.1, color: "#ff88aa" },
            { label: "RATE", value: rate, set: setRate, min: 0.5, max: 2, step: 0.1, color: "#88aaff" },
            { label: "VOLUME", value: volume, set: setVolume, min: 0, max: 1, step: 0.1, color: "#00ffaa" },
          ].map(({ label, value, set, min, max, step, color }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: "#555", letterSpacing: 2 }}>{label}</span>
                <span style={{ fontSize: 11, color }}>{value.toFixed(1)}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => set(parseFloat(e.target.value))}
                style={{ accentColor: color, cursor: "pointer" }}
              />
            </div>
          ))}

          {/* Voice selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220 }}>
            <span style={{ fontSize: 10, color: "#555", letterSpacing: 2 }}>VOICE ENGINE</span>
            <select
              value={selectedVoice?.name || ""}
              onChange={(e) => setSelectedVoice(availableVoices.find((v) => v.name === e.target.value))}
              style={{
                background: "rgba(0,255,170,0.05)", border: "1px solid rgba(0,255,170,0.15)",
                color: "#ccc", padding: "4px 8px", borderRadius: 6, fontSize: 11, outline: "none",
              }}
            >
              {availableVoices.map((v) => (
                <option key={v.name} value={v.name} style={{ background: "#0d1117" }}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* PDF Upload */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 10, color: "#555", letterSpacing: 2 }}>KNOWLEDGE SOURCE</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: pdfText ? "rgba(0,255,170,0.1)" : "rgba(255,255,255,0.03)",
                border: "1px solid rgba(0,255,170,0.2)", color: pdfText ? "#00ffaa" : "#555",
                padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11,
              }}
            >
              {pdfText ? `📄 ${pdfName}` : "📎 Upload .txt / .pdf"}
            </button>
            <input ref={fileInputRef} type="file" accept=".txt,.pdf" onChange={handlePDFUpload} style={{ display: "none" }} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 5, maxWidth: 800, width: "100%", margin: "0 auto", padding: "0 16px" }}>

        {/* Status bar */}
        <div style={{
          display: "flex", gap: 16, padding: "10px 0", alignItems: "center", justifyContent: "center",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: isListening ? "#ff4444" : isSpeaking ? "#00ffaa" : "#333", animation: (isListening || isSpeaking) ? "pulse 1s infinite" : "none" }} />
            <span style={{ color: isListening ? "#ff6666" : isSpeaking ? "#00ffaa" : "#444", letterSpacing: 2 }}>
              {isListening ? "LISTENING" : isSpeaking ? "SPEAKING" : isLoading ? "THINKING" : "READY"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#333", letterSpacing: 1 }}>
            {langInfo?.flag} {langInfo?.label} · {gender !== "Auto" ? `${gender === "Female" ? "♀" : "♂"} ${gender}` : "⚡ Auto"}
          </div>
        </div>

        {/* Waveform */}
        {(isListening || isSpeaking) && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 3, padding: "12px 0", height: 56,
          }}>
            {waveform.map((h, i) => (
              <div key={i} style={{
                width: 3, height: h, borderRadius: 2,
                background: isListening
                  ? `rgba(255,${80 + i * 8},${80 + i * 4},${0.6 + i * 0.02})`
                  : `rgba(0,${200 + i * 2},${120 + i * 6},${0.5 + i * 0.025})`,
                transition: "height 0.08s ease",
              }} />
            ))}
          </div>
        )}

        {/* Interim transcript */}
        {transcript && (
          <div style={{
            margin: "4px 0 8px", padding: "8px 14px", borderRadius: 8,
            background: "rgba(255,100,100,0.05)", border: "1px solid rgba(255,100,100,0.15)",
            color: "#ff8888", fontSize: 13, fontStyle: "italic",
          }}>
            🎤 {transcript}
          </div>
        )}

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "12px 0",
          display: "flex", flexDirection: "column", gap: 12,
          maxHeight: "55vh",
        }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              gap: 10, alignItems: "flex-end",
            }}>
              {msg.role === "agent" && (
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "conic-gradient(#00ffaa,#00aaff,#00ffaa)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                }}>🤖</div>
              )}
              <div style={{
                maxWidth: "72%", padding: "10px 14px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user"
                  ? "linear-gradient(135deg,rgba(0,170,255,0.15),rgba(0,100,200,0.1))"
                  : "rgba(0,0,0,0.4)",
                border: msg.role === "user" ? "1px solid rgba(0,170,255,0.25)" : "1px solid rgba(0,255,170,0.12)",
                fontSize: 14, lineHeight: 1.5, color: msg.role === "user" ? "#88ddff" : "#ddd",
              }}>
                {msg.text}
                {msg.role === "agent" && (
                  <button
                    onClick={() => speak(msg.text)}
                    style={{
                      display: "block", marginTop: 6, background: "none", border: "none",
                      color: "#00ffaa44", cursor: "pointer", fontSize: 11, padding: 0,
                    }}
                  >▶ replay</button>
                )}
              </div>
              {msg.role === "user" && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,170,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>👤</div>
              )}
            </div>
          ))}

          {isLoading && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "conic-gradient(#00ffaa,#00aaff,#00ffaa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, animation: "spin 1.5s linear infinite" }}>🤖</div>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#00ffaa", animation: `bounce 0.8s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 0" }}>
          {prompts.map((p, i) => (
            <button key={i} onClick={() => setInputText(p)} style={{
              background: "rgba(0,255,170,0.03)", border: "1px solid rgba(0,255,170,0.12)",
              color: "#00ffaa88", padding: "4px 10px", borderRadius: 20, fontSize: 11,
              cursor: "pointer", transition: "all 0.2s",
            }}>{p}</button>
          ))}
        </div>

        {/* Input bar */}
        <div style={{
          display: "flex", gap: 8, padding: "12px 0 16px",
          borderTop: "1px solid rgba(0,255,170,0.08)",
        }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message in ${langInfo?.label}...`}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                background: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,255,170,0.15)",
                color: "#eee", fontSize: 14, outline: "none", boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Mic button */}
          <button
            onClick={toggleListening}
            style={{
              width: 46, height: 46, borderRadius: 12, border: "none", cursor: "pointer",
              background: isListening
                ? "linear-gradient(135deg,#ff4444,#cc2222)"
                : "rgba(255,100,100,0.1)",
              color: isListening ? "#fff" : "#ff6666",
              fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", flexShrink: 0,
              boxShadow: isListening ? "0 0 20px rgba(255,50,50,0.4)" : "none",
            }}
          >{isListening ? "⏹" : "🎤"}</button>

          {/* Stop/Send */}
          {isSpeaking ? (
            <button onClick={stopSpeaking} style={{
              width: 46, height: 46, borderRadius: 12, border: "none", cursor: "pointer",
              background: "rgba(255,150,0,0.15)", color: "#ffaa00", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>⏸</button>
          ) : (
            <button onClick={sendMessage} disabled={!inputText.trim() || isLoading} style={{
              width: 46, height: 46, borderRadius: 12, border: "none", cursor: "pointer",
              background: inputText.trim() && !isLoading ? "linear-gradient(135deg,#00ffaa,#00cc88)" : "rgba(0,255,170,0.05)",
              color: inputText.trim() && !isLoading ? "#000" : "#00ffaa33",
              fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", flexShrink: 0,
              fontWeight: "bold",
            }}>➤</button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        * { box-sizing: border-box; }
        select option { background: #0d1117; color: #eee; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,170,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}
