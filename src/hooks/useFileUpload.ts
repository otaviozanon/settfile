import { useState, useRef, useCallback } from 'react';
import { PROVIDERS } from '../providers';
import { formatFileSize } from '../utils/validation';

export interface UploadResult {
  url: string;
  expire: string;
  provider: string;
}

export interface UploadState {
  selectedFile: File | null;
  uploading: boolean;
  progress: number;
  uploadResult: UploadResult | null;
  currentAttempt: string;
  statusText: string;
  triedProviders: Set<string>;
  selectedProviderId: string | null;
}

export interface UploadError {
  code: string;
  message: string;
  provider?: string;
  details?: unknown;
}

interface UseFileUploadOptions {
  onLog?: (message: string, level?: string) => void;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: UploadError) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { onLog, onSuccess, onError } = options;

  const [state, setState] = useState<UploadState>({
    selectedFile: null,
    uploading: false,
    progress: 0,
    uploadResult: null,
    currentAttempt: '-',
    statusText: 'Ready.',
    triedProviders: new Set(),
    selectedProviderId: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const log = useCallback((message: string, level?: string) => {
    onLog?.(message, level);
  }, [onLog]);

  const updateState = useCallback((updates: Partial<UploadState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const selectFile = useCallback((file: File) => {
    updateState({
      selectedFile: file,
      uploadResult: null,
      progress: 0,
      statusText: 'File selected.',
      currentAttempt: '-',
      triedProviders: new Set(),
    });
    log(`File selected: ${file.name} (${formatFileSize(file.size)})`);
  }, [log, updateState]);

  const setSelectedProviderId = useCallback((id: string | null) => {
    updateState({ selectedProviderId: id });
    if (id) {
      const provider = PROVIDERS.find(p => p.id === id);
      log(`Selected host: ${provider?.name || id}`);
    } else {
      log('Automatic host selection enabled.');
    }
  }, [log, updateState]);

  const clearUpload = useCallback(() => {
    updateState({
      selectedFile: null,
      uploadResult: null,
      progress: 0,
      currentAttempt: '-',
      statusText: 'Ready.',
      triedProviders: new Set(),
    });
    log('Upload cleared.');
  }, [log, updateState]);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      updateState({
        uploading: false,
        statusText: 'Upload canceled.',
      });
      log('Upload canceled by user.');
    }
  }, [log, updateState]);

  const upload = useCallback(async () => {
    if (!state.selectedFile) return;

    updateState({
      uploading: true,
      progress: 0,
      uploadResult: null,
    });

    abortControllerRef.current = new AbortController();

    const fileSizeMB = state.selectedFile.size / (1024 * 1024);
    
    // Filter compatible providers
    let compatibleProviders = PROVIDERS.filter(
      (p) => p.maxMB >= fileSizeMB && !state.triedProviders.has(p.id)
    );

    // If a provider is selected, put it at the front of the list if compatible
    if (state.selectedProviderId) {
      const selectedIndex = compatibleProviders.findIndex(p => p.id === state.selectedProviderId);
      if (selectedIndex !== -1) {
        const [selected] = compatibleProviders.splice(selectedIndex, 1);
        compatibleProviders = [selected, ...compatibleProviders.sort((a, b) => a.maxMB - b.maxMB)];
      } else {
        // Selected provider not compatible or already tried, continue with others sorted
        compatibleProviders = compatibleProviders.sort((a, b) => a.maxMB - b.maxMB);
        const selected = PROVIDERS.find(p => p.id === state.selectedProviderId);
        if (selected) {
          if (state.triedProviders.has(selected.id)) {
             log(`Note: Selected host ${selected.name} already tried, falling back to others.`);
          } else if (selected.maxMB < fileSizeMB) {
             log(`Note: Selected host ${selected.name} does not support file size, falling back to others.`);
          }
        }
      }
    } else {
      compatibleProviders = compatibleProviders.sort((a, b) => a.maxMB - b.maxMB);
    }

    if (compatibleProviders.length === 0) {
      const error: UploadError = {
        code: 'no_providers',
        message: 'No remaining providers available for upload.',
      };
      log(error.message);
      updateState({
        statusText: 'No remaining providers to try.',
        uploading: false,
      });
      onError?.(error);
      return;
    }

    log(`Starting upload: ${state.selectedFile.name}...`);
    updateState({ statusText: 'Uploading file...' });

    let attemptCount = 0;

    for (const provider of compatibleProviders) {
      if (abortControllerRef.current?.signal.aborted) break;

      attemptCount++;
      updateState({
        currentAttempt: `${attemptCount}/${compatibleProviders.length}`,
      });
      log(`Trying provider: ${provider.name}...`);

      try {
        if (!provider.upload) {
          log(`✗ Provider ${provider.name} not implemented`);
          setState(prev => ({
            ...prev,
            triedProviders: new Set([...prev.triedProviders, provider.id]),
          }));
          continue;
        }

        const url = await provider.upload(
          state.selectedFile,
          abortControllerRef.current.signal,
          (percent) => updateState({ progress: percent })
        );

        const result: UploadResult = {
          url,
          expire: provider.expire,
          provider: provider.name,
        };

        log(`✓ Upload completed on ${provider.name}`);
        updateState({
          uploadResult: result,
          statusText: `Success! File uploaded to ${provider.name}`,
          uploading: false,
          progress: 100,
        });

        setState(prev => ({
          ...prev,
          triedProviders: new Set([...prev.triedProviders, provider.id]),
        }));

        onSuccess?.(result);
        return;
      } catch (err) {
        const error: UploadError = {
          code: 'upload_failed',
          message: (err as Error).message,
          provider: provider.name,
          details: err,
        };

        log(`✗ Failed on ${provider.name}: ${error.message}`);
        setState(prev => ({
          ...prev,
          triedProviders: new Set([...prev.triedProviders, provider.id]),
          progress: 0,
        }));
      }
    }

    const finalError: UploadError = {
      code: 'all_providers_failed',
      message: 'All remaining providers failed.',
    };

    updateState({
      statusText: `Error: ${finalError.message}`,
      uploading: false,
      currentAttempt: '-',
    });
    log(finalError.message);
    onError?.(finalError);
  }, [state.selectedFile, state.triedProviders, state.selectedProviderId, log, updateState, onSuccess, onError]);

  const retryWithAnotherProvider = useCallback(async () => {
    if (!state.selectedFile) return;
    updateState({
      uploadResult: null,
      progress: 0,
      statusText: 'Trying another host...',
    });
    log('Reuploading file to another available host...');
    await upload();
  }, [state.selectedFile, log, updateState, upload]);

  return {
    state,
    selectFile,
    setSelectedProviderId,
    upload,
    cancelUpload,
    clearUpload,
    retryWithAnotherProvider,
    abortControllerRef,
  };
}
