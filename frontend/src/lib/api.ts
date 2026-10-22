import { getToken } from "./auth";
import { compressFormImages } from "./image";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/** Жүктеу басталғанша blob-URL өмір сүруі керек. */
const OBJECT_URL_TTL_MS = 60_000;

const NETWORK_ERROR_MESSAGE = "Не удалось связаться с сервером";
const GENERIC_ERROR_MESSAGE = "Что-то пошло не так";

export class ApiError extends Error {
  /** HTTP статусы; желі қатесінде — 0. */
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type UnauthorizedHandler = () => void;

let handleUnauthorized: UnauthorizedHandler | null = null;

/**
 * SessionProvider тіркейді: токен ескірсе немесе пароль басқа жерде ауысса,
 * кез келген сұрау 401 алғанда сессия тазаланып, логинге жіберіледі.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  handleUnauthorized = handler;
}

function errorMessage(data: unknown, fallback = GENERIC_ERROR_MESSAGE): string {
  const detail =
    typeof data === "object" && data !== null && "detail" in data ? data.detail : undefined;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return "Проверьте правильность введённых данных";
  return fallback;
}

/** Барлық сұраудың ортақ бөлігі: токен, желі қатесі, 401, қате мәтіні. */
async function request(path: string, init: RequestInit = {}, fallback?: string): Promise<Response> {
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
  }

  if (response.ok) return response;

  // Токенсіз 401 — бұл қате логин/пароль, сессияға қатысы жоқ.
  if (response.status === 401 && token) handleUnauthorized?.();
  const data = await response.json().catch(() => null);
  throw new ApiError(errorMessage(data, fallback), response.status);
}

/**
 * JSON сұрау. Жауап типі `T` — backend схемасымен келісім (runtime-та
 * тексерілмейді: схемалар `app/schemas/*`-пен қолмен сәйкестендіріледі).
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await request(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  return (await response.json().catch(() => null)) as T;
}

/**
 * Файл жүктеу үшін: Content-Type-ты (multipart boundary) браузердің өзі қояды.
 * Суреттер жіберер алдында кішірейтіледі (`lib/image.ts`).
 */
export async function apiForm<T>(path: string, form: FormData): Promise<T> {
  const body = await compressFormImages(form);
  const response = await request(path, { method: "POST", body });
  return (await response.json().catch(() => null)) as T;
}

/** Қорғалған файлды жүктеп алу (токен header арқылы кетеді). */
export async function download(path: string, filename: string): Promise<void> {
  // Қорғалған файлды браузер кэшінен бермейміз: ауыстырылған/жойылған файл
  // үшін әрқашан сервердің нақты жауабы керек.
  const response = await request(path, { cache: "no-store" }, "Не удалось скачать файл");

  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  // Firefox DOM-ға қосылмаған сілтемені басуды елемеуі мүмкін.
  document.body.append(link);
  link.click();
  link.remove();
  // URL-ді бірден жойсақ, Firefox жүктеуді бастамай жатып үзіп тастайды.
  setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_TTL_MS);
}

/** catch-блоктағы белгісіз қатені пайдаланушыға көрсетілетін мәтінге айналдырады. */
export function getErrorMessage(caught: unknown): string {
  return caught instanceof ApiError ? caught.message : GENERIC_ERROR_MESSAGE;
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
