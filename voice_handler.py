import whisper
from gtts import gTTS
import sounddevice as sd
import scipy.io.wavfile as wav
import numpy as np
import os

# Load Whisper model for Speech-to-Text
whisper_model = whisper.load_model("base")

def record_audio(duration=5, sample_rate=16000):
    """Record audio from microphone"""
    print(f"Recording for {duration} seconds...")
    audio = sd.rec(
        int(duration * sample_rate),
        samplerate=sample_rate,
        channels=1,
        dtype=np.int16
    )
    sd.wait()  # Wait until recording is done
    
    # Save to temp file
    wav.write("temp_audio.wav", sample_rate, audio)
    print("Recording complete.")
    return "temp_audio.wav"

def speech_to_text(audio_path):
    """Convert speech to text using OpenAI Whisper"""
    result = whisper_model.transcribe(audio_path)
    text = result["text"].strip()
    print(f"Recognized: {text}")
    return text

def text_to_speech(text, output_file="response.mp3"):
    """Convert text answer to speech using gTTS"""
    tts = gTTS(text=text, lang="en", slow=False)
    tts.save(output_file)
    if os.name == "nt":
        os.system(f"start {output_file}")
    else:
        os.system(f"mpg321 {output_file}")