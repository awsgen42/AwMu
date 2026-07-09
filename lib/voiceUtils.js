// Voice recording helper — MediaRecorder se record karke base64 deta hai
export function createRecorder() {
  let mediaRecorder = null;
  let chunks = [];
  let stream = null;

  return {
    async start() {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      // Chota file size ke liye low bitrate
      const options = { audioBitsPerSecond: 32000 };
      try {
        mediaRecorder = new MediaRecorder(stream, { ...options, mimeType: "audio/webm;codecs=opus" });
      } catch {
        mediaRecorder = new MediaRecorder(stream, options);
      }
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.start();
    },

    stop() {
      return new Promise((resolve, reject) => {
        if (!mediaRecorder) return reject(new Error("Recording shuru nahi hui"));
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
          stream?.getTracks().forEach((t) => t.stop());
          if (blob.size > 900000) {
            reject(new Error("Voice note bohat lambi hai"));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Audio parhi nahi gayi"));
          reader.readAsDataURL(blob);
        };
        mediaRecorder.stop();
      });
    },

    cancel() {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.onstop = () => {};
        mediaRecorder.stop();
      }
      stream?.getTracks().forEach((t) => t.stop());
    },
  };
}
