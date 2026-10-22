/**
 * Телефоннан түсірілген дәптер суреттері 2–15 МБ болады: оларды сақтау орны
 * (Cloudflare R2) тез толады және студентке жүктеу ұзаққа созылады.
 * Сондықтан JPG/PNG жіберер алдында браузерде кішірейтіледі.
 */
const COMPRESSIBLE_TYPES = new Set(["image/jpeg", "image/png"]);
/** Бұдан кіші сурет сол күйі кетеді: қысудан пайда аз. */
const MIN_COMPRESS_BYTES = 400 * 1024;
/** Ұзын жағы: дәптердегі жазуды оқуға жеткілікті. */
const MAX_DIMENSION_PX = 1600;
const JPEG_QUALITY = 0.82;

async function compressImage(file: File): Promise<File> {
  if (!COMPRESSIBLE_TYPES.has(file.type) || file.size < MIN_COMPRESS_BYTES) return file;

  try {
    // EXIF бағыты ескерілмесе, телефон суреті бүйірінен жатып қалады.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext("2d");
    if (!context) return file;
    // JPEG-те мөлдірлік жоқ: PNG-дің мөлдір жерлері қара емес, ақ болуы үшін.
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.(jpe?g|png)$/i, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    // Браузер суретті аша алмаса (сирек формат, жад жетпеді) — түпнұсқа жіберіледі.
    return file;
  }
}

/** Формадағы барлық суреттерді кішірейтілген нұсқаларымен ауыстырады. */
export async function compressFormImages(form: FormData): Promise<FormData> {
  const result = new FormData();
  for (const [key, value] of form.entries()) {
    if (value instanceof File && value.size > 0) {
      const file = await compressImage(value);
      result.append(key, file, file.name);
    } else {
      result.append(key, value);
    }
  }
  return result;
}
