import { uploadToCatbox } from "./catbox";
import { uploadToFilebin } from "./filebin";
import { uploadToFreeimage } from "./freeimage";
import { uploadToGofile } from "./gofile";
import { uploadToSafeNote } from "./safenote";
import { uploadToTmpfiles } from "./tmpfiles";
import { uploadToUfile } from "./ufile";
import { uploadToPixeldrain } from "./pixeldrain";
import { uploadToAnonfiles } from "./anonfiles";
import { uploadToTransfersh } from "./transfersh";
import { uploadToLitterbox } from "./litterbox";

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
    expire: "60 minutes",
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
    expire: "24 hours",
    upload: uploadToSafeNote,
  },
  {
    id: "catbox",
    name: "catbox.moe",
    maxMB: 200,
    expire: "Indefinite",
    upload: uploadToCatbox,
  },
  {
    id: "litterbox",
    name: "Litterbox",
    maxMB: 1024, // 1 GB
    expire: "24 hours",
    upload: uploadToLitterbox,
  },
  {
    id: "ufile",
    name: "Ufile.io",
    maxMB: 5120, // 5 GB
    expire: "Indefinite",
    upload: uploadToUfile,
  },
  {
    id: "pixeldrain",
    name: "Pixeldrain",
    maxMB: 10240, // 10 GB
    expire: "90 days",
    upload: uploadToPixeldrain,
  },
  {
    id: "gofile",
    name: "gofile.io",
    maxMB: 10240, // 10 GB
    expire: "7 days",
    upload: uploadToGofile,
  },
  {
    id: "transfersh",
    name: "Transfer.sh",
    maxMB: 10240, // 10 GB
    expire: "14 days",
    upload: uploadToTransfersh,
  },
  {
    id: "anonfiles",
    name: "AnonFiles",
    maxMB: 20480, // 20 GB
    expire: "Indefinite",
    upload: uploadToAnonfiles,
  },
];
