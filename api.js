const APP_CONFIG = {
  // Thay thế URL sau bằng URL Web App của bạn sau khi deploy MỚI NHẤT
  API_URL: "https://script.google.com/macros/s/AKfycbxFbgZ56T-IN72GN67eL3DKUNCdVibYZ0Qegv5vaIPFAdAsLBNu_Fv-hLO8l8xztkCAwQ/exec"
};

/**
 * Gọi API backend trên Google Apps Script
 */
async function callAPI(action, payload = {}) {
  try {
    payload.action = action;
    const response = await fetch(APP_CONFIG.API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "text/plain" // Trick để tránh lỗi CORS Preflight
      }
    });

    // Nếu request bị redirect auth hoặc lỗi phân giải script
    if (!response.ok) {
      throw new Error("HTTP error " + response.status);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error:", error);
    return { success: false, message: "Lỗi kết nối API: " + error.message };
  }
}
/**
 * Tiện ích nén ảnh client-side
 * Mục tiêu: dung lượng 200-300kb
 */
async function compressImage(file, quality = 0.7, maxWidth = 1024) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', quality);
      };
    };
  });
}

/**
 * Upload ảnh lên Cloudinary với nén tự động
 */
async function uploadImage(file, folder, onProgress) {
  try {
    const cfgRes = await callAPI('getCloudinaryConfig');
    if (!cfgRes.success) throw new Error("Không lấy được cấu hình Cloudinary");

    const compressedBlob = await compressImage(file);

    const formData = new FormData();
    formData.append('file', compressedBlob, 'image.jpg');
    formData.append('upload_preset', cfgRes.data.uploadPreset);
    formData.append('folder', folder || 'pccc');

    const xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cfgRes.data.cloudName}/image/upload`, true);

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          resolve(res.secure_url);
        } else {
          reject(new Error("Lỗi upload Cloudinary"));
        }
      };

      xhr.onerror = () => reject(new Error("Lỗi kết nối upload"));
      xhr.send(formData);
    });
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}
