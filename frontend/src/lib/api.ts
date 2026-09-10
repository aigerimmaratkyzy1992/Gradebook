import { getToken } from "./auth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError("Не удалось связаться с сервером");
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(errorMessage(data));
  return data as T;
}

function errorMessage(data: unknown): string {
  const detail = (data as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return "Проверьте правильность введённых данных";
  return "Что-то пошло не так";
}

/** Файл жүктеу үшін: Content-Type-ты браузердің өзі қояды. */
export async function apiForm<T>(path: string, form: FormData): Promise<T> {
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new ApiError("Не удалось связаться с сервером");
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(errorMessage(data));
  return data as T;
}

/** Қорғалған файлды жүктеп алу (токен header арқылы кетеді). */
export async function download(path: string, filename: string): Promise<void> {
  const token = getToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new ApiError("Не удалось скачать файл");

  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Формадағы таңдалған файлдарды тапсырмаға тіркейді. Файл жоқ болса — тыныш. */
export async function uploadAssignmentFiles(
  assignmentId: number,
  data: FormData,
): Promise<void> {
  const files = data
    .getAll("files")
    .filter((item): item is File => item instanceof File && item.size > 0);
  if (files.length === 0) return;

  const form = new FormData();
  for (const file of files) form.append("files", file);
  await apiForm(`/api/assignments/${assignmentId}/files`, form);
}
