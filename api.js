const APP_CONFIG = {
  // Thay thế URL sau bằng URL Web App của bạn sau khi deploy MỚI NHẤT
  API_URL: "https://script.google.com/macros/s/AKfycby6bVHUx_iIfSrEhL3guuIDoUcWSHowSbGtlx0RP8lF6oxXQKF9GX0LV2QnHMcnay10Rw/exec"
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
        "Content-Type": "text/plain;charset=utf-8" // Trick để tránh lỗi CORS Preflight
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
