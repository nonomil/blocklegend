"""Optional faster-whisper helper for buddy-proxy /v1/stt. Audio in, text out."""
import os
import sys


def main():
    if len(sys.argv) < 2:
        sys.stderr.write("usage: whisper-stt.py <audio> [prompt]\n")
        sys.exit(1)
    audio = sys.argv[1]
    prompt = sys.argv[2] if len(sys.argv) > 2 else ""
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.stderr.write("faster-whisper missing\n")
        sys.exit(2)
    name = os.environ.get("WHISPER_MODEL", "tiny")
    try:
        model = WhisperModel(name, device="cpu", compute_type="int8", local_files_only=True)
    except Exception:
        model = WhisperModel(name, device="cpu", compute_type="int8")
    segments, _info = model.transcribe(
        audio,
        language="en",
        initial_prompt=prompt[:200] or None,
    )
    text = " ".join(s.text.strip() for s in segments if s.text)
    sys.stdout.write(text)
    sys.stdout.flush()


if __name__ == "__main__":
    main()
