import { Readable } from "node:stream";
import { ReplitConnectors } from "@replit/connectors-sdk";

// 上傳目的地:Google Drive「EM婚禮後台 > 二手物交換」資料夾
const UPLOAD_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID ?? "1VqLH2HkuF6Jd_nomjHMQSVPy6NMroOEW";

const connectors = new ReplitConnectors();

type DriveRequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string | Buffer;
};

async function driveApi(path: string, options: DriveRequestOptions = {}): Promise<Response> {
  const response = await connectors.proxy("google-drive", path, options);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Google Drive API ${response.status}: ${body.slice(0, 500)}`);
  }
  return response;
}

const folderIdCache = new Map<string, string>();

/** 在上傳根資料夾下尋找或建立指定名稱的子資料夾,回傳其 id */
export async function ensureSubfolder(name: string): Promise<string> {
  const cached = folderIdCache.get(name);
  if (cached) return cached;

  const query = encodeURIComponent(
    `name = '${name.replace(/'/g, "\\'")}' and '${UPLOAD_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
  );
  const searchResponse = await driveApi(
    `/drive/v3/files?q=${query}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
  );
  const search = (await searchResponse.json()) as { files?: Array<{ id: string }> };
  let folderId = search.files?.[0]?.id;

  if (!folderId) {
    const createResponse = await driveApi("/drive/v3/files?fields=id&supportsAllDrives=true", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [UPLOAD_FOLDER_ID],
      }),
    });
    const created = (await createResponse.json()) as { id?: string };
    if (!created.id) throw new Error("Google Drive did not return a folder id");
    folderId = created.id;
  }

  folderIdCache.set(name, folderId);
  return folderId;
}

export async function uploadWebp(buffer: Buffer, filename: string, folderId?: string): Promise<string> {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const metadata = JSON.stringify({ name: filename, parents: [folderId ?? UPLOAD_FOLDER_ID] });

  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
        `--${boundary}\r\nContent-Type: image/webp\r\n\r\n`,
    ),
    buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const response = await driveApi(
    "/upload/drive/v3/files?uploadType=multipart&fields=id&supportsAllDrives=true",
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );

  const data = (await response.json()) as { id?: string };
  if (!data.id) throw new Error("Google Drive did not return a file id");
  return data.id;
}

export async function downloadFile(fileId: string) {
  const response = await driveApi(
    `/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
  );
  if (!response.body) throw new Error("Google Drive returned an empty body");
  const stream = Readable.fromWeb(response.body as import("node:stream/web").ReadableStream);
  return { data: stream };
}

export async function deleteFile(fileId: string): Promise<void> {
  await driveApi(`/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`, {
    method: "DELETE",
  });
}
