import { uploadToCatbox } from "./catBox";
import { uploadToFilebin } from "./filebin";
import { uploadToFreeimage } from "./freeimage";
import { uploadToGofile } from "./gofile";
import { uploadToTmpfiles } from "./tmpfiles";

export interface Provider {
  id: string;
  name: string;
  maxMB: number;
  expire: string;
  upload?: (file: File, signal?: AbortSignal) => Promise<string>;
}

export const PROVIDERS: Provider[] = [
  // {
  //   id: "gofile",
  //   name: "gofile.io",
  //   maxMB: 10240,
  //   expire: "10 days",
  //   upload: uploadToGofile,
  // },
  // {
  //   id: "tmpfiles",
  //   name: "tmpfiles.org",
  //   maxMB: 100,
  //   expire: "60 minutes",
  //   upload: uploadToTmpfiles,
  // },
  // {
  //   id: "catbox",
  //   name: "catbox.moe",
  //   maxMB: 200,
  //   expire: "Indefinite",
  //   upload: uploadToCatbox,
  // },
  // {
  //   id: "freeimage",
  //   name: "Freeimage.host",
  //   maxMB: 64,
  //   expire: "Indefinite",
  //   upload: uploadToFreeimage,
  // },
  {
    id: "filebin",
    name: "Filebin.net",
    maxMB: 100,
    expire: "Indefinite",
    upload: uploadToFilebin,
  },
];
