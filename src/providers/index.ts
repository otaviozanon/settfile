import { uploadToCatbox } from "./catbox";
import { uploadToFilebin } from "./filebin";
import { uploadToFreeimage } from "./freeimage";
import { uploadToGofile } from "./gofile";
import { uploadToSafeNote } from "./safenote";
import { uploadToTmpfiles } from "./tmpfiles";
import { uploadToUfile } from "./ufile";

export interface Provider {
  id: string;
  name: string;
  maxMB: number;
  expire: string;
  upload?: (
    file: File,
    signal?: AbortSignal,
    onProgress?: (percent: number) => void
  ) => Promise<string>;
}

export const PROVIDERS: Provider[] = [
  {
    id: "freeimage",
    name: "Freeimage.host",
    maxMB: 64, // 64 MB
    expire: "Indefinite",
    upload: uploadToFreeimage,
  },
  {
    id: "tmpfiles",
    name: "tmpfiles.org",
    maxMB: 100, // 100 MB
    expire: "60 minutes",
    upload: uploadToTmpfiles,
  },
  {
    id: "filebin",
    name: "Filebin.net",
    maxMB: 100, // 100 MB
    expire: "7 days",
    upload: uploadToFilebin,
  },
  {
    id: "safenote",
    name: "SafeNote.co",
    maxMB: 100,
    expire: "24 hours",
    upload: uploadToSafeNote,
  },
  {
    id: "catbox",
    name: "catbox.moe",
    maxMB: 200, // 200 MB
    expire: "Indefinite",
    upload: uploadToCatbox,
  },
  {
    id: "ufile",
    name: "Ufile.io",
    maxMB: 5120, // 5 GB
    expire: "Indefinite",
    upload: uploadToUfile,
  },
  {
    id: "gofile",
    name: "gofile.io",
    maxMB: 10240, // 10 GB
    expire: "7 days",
    upload: uploadToGofile,
  },
];
