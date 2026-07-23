import axios from "axios";

interface ApiErrorBody {
  error?: { message?: string };
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return fallback;
  return error.response?.data?.error?.message ?? fallback;
}
