// Chhoti video ko base64 me convert karta hai (Firestore 1MB limit check ke saath)
export function readVideo(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 900000) {
      reject(new Error("Video bohat bari hai — sirf ~10 sec ki chhoti clip bhejo (900KB tak)"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Video parhi nahi gayi"));
    reader.readAsDataURL(file);
  });
}
