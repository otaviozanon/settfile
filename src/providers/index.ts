import { uploadToFilebin } from "./filebin";
import { uploadToFreeimage } from "./freeimage";
import { uploadToGofile } from "./gofile";
import { uploadToSafeNote } from "./safenote";
import { uploadToTmpfiles } from "./tmpfiles";
import { uploadToUfile } from "./ufile";
import { uploadToUguu } from "./uguu";

export interface Provider {
  id: string;
  name: string;
  maxMB: number;
  expire: string;
  upload?: (
    file: File,
    signal?: AbortSignal,
    onProgress?: (percent: number) => void,
  ) => Promise<string>;
}

export const PROVIDERS: Provider[] = [
  {
    id: "freeimage",
    name: "Freeimage.host",
    maxMB: 64,
    expire: "Indefinite",
    upload: uploadToFreeimage,
  },
  {
    id: "tmpfiles",
    name: "tmpfiles.org",
    maxMB: 100,
    expire: "1-48 hours", // Configurable: 60min default, up to 48h
    upload: uploadToTmpfiles,
  },
  {
    id: "filebin",
    name: "Filebin.net",
    maxMB: 100,
    expire: "7 days",
    upload: uploadToFilebin,
  },
  {
    id: "safenote",
    name: "SafeNote.co",
    maxMB: 100,
    expire: "Up to 30 days", // Configurable: 1h to 30 days
    upload: uploadToSafeNote,
  },
  {
    id: "ufile",
    name: "Ufile.io",
    maxMB: 5120, // 5 GB
    expire: "30 days", // Free tier: 30 days, Pro: indefinite
    upload: uploadToUfile,
  },
  {
    id: "gofile",
    name: "gofile.io",
    maxMB: 10240, // 10 GB
    expire: "Inactive cleanup", // Files removed after period of inactivity (free tier)
    upload: uploadToGofile,
  },
  {
    id: "uguu",
    name: "Uguu.se",
    maxMB: 128, // 128 MB
    expire: "3 hours", // Fixed 3 hours
    upload: uploadToUguu,
  },
];
