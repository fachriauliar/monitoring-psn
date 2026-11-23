const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const TOKEN_KEY = "token";

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(path, options = {}) {
  const { auth = true, token, headers = {}, body, ...restOptions } = options;

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  let requestBody = body;

  if (body !== undefined && body !== null && !isFormData) {
    requestHeaders["Content-Type"] = "application/json";

    if (typeof body !== "string") {
      requestBody = JSON.stringify(body);
    }
  }

  const accessToken =
    token ??
    (typeof localStorage !== "undefined"
      ? localStorage.getItem(TOKEN_KEY)
      : null);

  if (auth && accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...restOptions,
      method: restOptions.method || "GET",
      headers: requestHeaders,
      body: requestBody,
    });
  } catch {
    throw new ApiError(
      "Tidak dapat terhubung ke server. Periksa koneksi dan server backend.",
      0,
    );
  }

  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok || result?.success === false) {
    throw new ApiError(
      result?.message || "Terjadi kesalahan saat menghubungi server.",
      response.status,
      result,
    );
  }

  return result;
}

// =========================================================
// AUTHENTICATION API
// =========================================================

export const authApi = {
  login(email, password) {
    return apiRequest("/api/auth/login", {
      method: "POST",
      auth: false,
      body: {
        email,
        password,
      },
    });
  },

  me() {
    return apiRequest("/api/auth/me");
  },

  changePassword(data) {
    return apiRequest("/api/auth/change-password", {
      method: "PATCH",
      body: data,
    });
  },
};

export { API_URL, ApiError };
