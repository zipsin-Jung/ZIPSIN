/**
 * 사진을 날짜·장소로 묶기 위해 휴대폰(브라우저) 안에서만 촬영 정보를 읽는다 (승인 시안 ⑤-나 '사진 한꺼번에').
 * - 읽은 위치(GPS)는 묶기에만 쓰고 서버로 보내지 않는다. 올리는 사진은 prepare-photo가 위치정보를 지운다.
 * - JPEG 안의 EXIF(촬영 시각·GPS)만 읽는다. 없거나 읽을 수 없으면 파일 시각(한국 시간)을 쓴다.
 */
export type LocalTime = { year: number; month: number; day: number; hour: number; minute: number };
export type GeoPoint = { lat: number; lng: number };
export type PhotoMeta = { takenAt: LocalTime | null; gps: GeoPoint | null };

const EMPTY: PhotoMeta = { takenAt: null, gps: null };
const HEAD_BYTES = 256 * 1024;

export function parseExif(buffer: ArrayBuffer): PhotoMeta {
  try {
    const view = new DataView(buffer);
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return EMPTY;
    let offset = 2;
    while (offset + 4 <= view.byteLength) {
      const marker = view.getUint16(offset);
      if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) return EMPTY;
      const length = view.getUint16(offset + 2);
      if (marker === 0xffe1 && view.getUint32(offset + 4) === 0x45786966) return readTiff(view, offset + 10);
      offset += 2 + length;
    }
    return EMPTY;
  } catch {
    return EMPTY;
  }
}

function readTiff(view: DataView, start: number): PhotoMeta {
  const little = view.getUint16(start) === 0x4949;
  const u16 = (at: number) => view.getUint16(start + at, little);
  const u32 = (at: number) => view.getUint32(start + at, little);
  const entries = (ifd: number) => {
    const list = new Map<number, { type: number; count: number; at: number }>();
    const count = u16(ifd);
    for (let i = 0; i < count; i += 1) {
      const at = ifd + 2 + i * 12;
      list.set(u16(at), { type: u16(at + 2), count: u32(at + 4), at: at + 8 });
    }
    return list;
  };
  const ascii = (entry: { count: number; at: number }) => {
    const from = entry.count > 4 ? u32(entry.at) : entry.at;
    let text = '';
    for (let i = 0; i < entry.count; i += 1) {
      const code = view.getUint8(start + from + i);
      if (code === 0) break;
      text += String.fromCharCode(code);
    }
    return text;
  };
  const rationals = (entry: { count: number; at: number }) => {
    const from = u32(entry.at);
    return Array.from({ length: entry.count }, (_, i) => { const den = u32(from + i * 8 + 4); return den ? u32(from + i * 8) / den : 0; });
  };

  const ifd0 = entries(u32(4));
  let takenAt: LocalTime | null = null;
  const exifPointer = ifd0.get(0x8769);
  if (exifPointer) {
    const original = entries(u32(exifPointer.at)).get(0x9003);
    if (original) takenAt = parseExifTime(ascii(original));
  }
  let gps: GeoPoint | null = null;
  const gpsPointer = ifd0.get(0x8825);
  if (gpsPointer) {
    const tags = entries(u32(gpsPointer.at));
    const latRef = tags.get(1); const lat = tags.get(2); const lngRef = tags.get(3); const lng = tags.get(4);
    if (latRef && lat && lngRef && lng) {
      const degrees = (parts: number[]) => parts[0] + (parts[1] ?? 0) / 60 + (parts[2] ?? 0) / 3600;
      const latValue = degrees(rationals(lat)) * (ascii(latRef) === 'S' ? -1 : 1);
      const lngValue = degrees(rationals(lng)) * (ascii(lngRef) === 'W' ? -1 : 1);
      if (Number.isFinite(latValue) && Number.isFinite(lngValue) && (latValue !== 0 || lngValue !== 0)) gps = { lat: latValue, lng: lngValue };
    }
  }
  return { takenAt, gps };
}

function parseExifTime(text: string): LocalTime | null {
  const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2})/.exec(text);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  if (year < 1990 || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  return { year, month, day, hour, minute };
}

export function localTimeFromMillis(millis: number): LocalTime {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
    .formatToParts(new Date(millis)).map((part) => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour), minute: Number(parts.minute) };
}

async function readHead(file: File): Promise<ArrayBuffer | null> {
  const head = file.slice(0, HEAD_BYTES);
  if (typeof head.arrayBuffer === 'function') return head.arrayBuffer().catch(() => null);
  /* v8 ignore next 6 -- arrayBuffer가 없는 오래된 브라우저 */
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(head);
  });
}

export async function readPhotoMeta(file: File): Promise<PhotoMeta> {
  const buffer = await readHead(file);
  const meta = buffer ? parseExif(buffer) : EMPTY;
  return { takenAt: meta.takenAt ?? (file.lastModified ? localTimeFromMillis(file.lastModified) : null), gps: meta.gps };
}
