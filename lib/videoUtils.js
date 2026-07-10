// Chhoti video ko base64 me convert karta hai (Firestore 1MB limit check ke saath)
export function readVideo(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 900000) {
      reject(new Error("Video is too large — send a short clip (~10 sec, up to 900KB)"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read video"));
    reader.readAsDataURL(file);
  });
}
