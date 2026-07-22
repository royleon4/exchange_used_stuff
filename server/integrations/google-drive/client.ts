import { Readable } from "node:stream";
import { google } from "googleapis";

function config() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!clientId || !clientSecret || !refreshToken || !folderId) {
    throw new Error("Google Drive secrets are not fully configured");
  }

  return { clientId, clientSecret, refreshToken, folderId };
}

function driveClient() {
  const { clientId, clientSecret, refreshToken } = config();
  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth });
}

export async function uploadWebp(buffer: Buffer, filename: string): Promise<string> {
  const { folderId } = config();
  const drive = driveClient();
  const result = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType: "image/webp",
      body: Readable.from(buffer),
    },
    fields: "id",
    supportsAllDrives: true,
  });

  if (!result.data.id) throw new Error("Google Drive did not return a file id");
  return result.data.id;
}

export async function downloadFile(fileId: string) {
  const drive = driveClient();
  return drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "stream" },
  );
}

export async function deleteFile(fileId: string): Promise<void> {
  const drive = driveClient();
  await drive.files.delete({ fileId, supportsAllDrives: true });
}
