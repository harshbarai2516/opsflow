const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export async function registerUser(
  email: string,
  password: string
) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function loginUser(
  email: string,
  password: string
) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function logoutUser() {
  return apiRequest("/api/auth/logout", {
    method: "POST",
  });
}

export async function getCurrentUser() {
  return apiRequest("/api/auth/me");
}