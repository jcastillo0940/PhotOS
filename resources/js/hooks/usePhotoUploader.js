import { router } from '@inertiajs/react';
import { useState, useCallback, useEffect, useRef } from 'react';

function getCsrfToken() {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

function uploadBatch(url, files, onProgress, onServerProcessing) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('photos[]', file));

        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(e.loaded, e.total);
        };
        xhr.upload.onloadend = () => onServerProcessing();
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                let detail = '';
                try {
                    const body = JSON.parse(xhr.responseText);
                    if (body?.message) detail = ': ' + body.message;
                    else if (body?.errors) detail = ': ' + Object.values(body.errors).flat().join(', ');
                } catch (_) {
                    detail = xhr.responseText ? ': ' + xhr.responseText.substring(0, 200) : '';
                }
                const error = new Error(`Error ${xhr.status}${detail}`);
                error.status = xhr.status;
                reject(error);
            }
        };
        xhr.onerror = () => {
            const error = new Error('Error de conexion');
            error.status = 0;
            reject(error);
        };
        xhr.open('POST', url);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        const token = getCsrfToken();
        if (token) xhr.setRequestHeader('X-XSRF-TOKEN', token);
        xhr.withCredentials = true;
        xhr.send(formData);
    });
}

const INITIAL = {
    isUploading: false,
    isDone: false,
    totalFiles: 0,
    uploadedFiles: 0,
    failedFiles: 0,
    totalBytes: 0,
    loadedBytes: 0,
    speedBps: 0,
    etaSeconds: null,
    offline: false,
    errors: [],
};

const CF_MAX_BYTES = 90 * 1024 * 1024;
const CF_TARGET_BATCH_BYTES = 70 * 1024 * 1024;

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForOnline() {
    if (typeof navigator === 'undefined' || navigator.onLine !== false) return Promise.resolve();
    return new Promise((resolve) => {
        window.addEventListener('online', resolve, { once: true });
    });
}

function shouldRetryUploadError(error) {
    const status = Number(error?.status ?? 0);
    return status === 0 || status === 408 || status === 429 || status >= 500;
}

function makeUploadBatches(files, batchSize) {
    const maxBatchSize = Math.max(1, Number(batchSize) || 1);
    const batches = [];
    for (const file of files) {
        const current = batches[batches.length - 1];
        const currentBytes = current?.reduce((total, item) => total + item.size, 0) ?? 0;
        const canAppend = current
            && current.length < maxBatchSize
            && currentBytes + file.size <= CF_TARGET_BATCH_BYTES;
        if (canAppend) {
            current.push(file);
        } else {
            batches.push([file]);
        }
    }
    return batches;
}

function initialConcurrency(maxConcurrent) {
    const requested = Math.max(1, Number(maxConcurrent) || 1);
    const connection = typeof navigator !== 'undefined' ? navigator.connection : null;
    if (connection?.saveData) return 1;
    if (['slow-2g', '2g'].includes(connection?.effectiveType)) return 1;
    if (connection?.effectiveType === '3g') return Math.min(2, requested);
    if (connection?.downlink && connection.downlink < 1.5) return 1;
    if (connection?.downlink && connection.downlink < 4) return Math.min(2, requested);
    return requested;
}

export function usePhotoUploader({ uploadUrl, batchSize = 1, maxConcurrent = 3, reloadOnly = null }) {
    const [state, setState] = useState(INITIAL);
    const speedRef = useRef({ window: [], completedBytes: 0, batchLoaded: {} });

    useEffect(() => {
        if (!state.isUploading) return undefined;
        const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [state.isUploading]);

    useEffect(() => {
        if (!state.isUploading || !navigator?.wakeLock?.request) return undefined;
        let lock = null;
        let cancelled = false;
        navigator.wakeLock.request('screen')
            .then((l) => { if (!cancelled) lock = l; else l.release().catch(() => {}); })
            .catch(() => {});
        return () => { cancelled = true; lock?.release().catch(() => {}); };
    }, [state.isUploading]);

    const computeSpeed = useCallback((totalLoaded) => {
        const now = Date.now();
        const ref = speedRef.current;
        ref.window.push({ time: now, bytes: totalLoaded });

        const WINDOW_MS = 5000;
        while (ref.window.length > 1 && now - ref.window[0].time > WINDOW_MS) {
            ref.window.shift();
        }

        if (ref.window.length < 2) return 0;
        const oldest = ref.window[0];
        const elapsed = (now - oldest.time) / 1000;
        const diff = totalLoaded - oldest.bytes;
        return elapsed > 0 ? Math.max(0, diff / elapsed) : 0;
    }, []);

    const upload = useCallback(async (files) => {
        if (!files?.length) return;

        const all = Array.from(files);
        const oversized = all.filter((f) => f.size > CF_MAX_BYTES);
        if (oversized.length > 0) {
            const names = oversized.map((f) => `${f.name} (${(f.size / 1048576).toFixed(0)} MB)`).join(', ');
            setState({ ...INITIAL, isDone: true, failedFiles: oversized.length, errors: [`Limite 90 MB: ${names}`] });
            return;
        }

        const uploadItems = makeUploadBatches(all, batchSize);
        let concurrency = Math.min(initialConcurrency(maxConcurrent), uploadItems.length);
        const totalBytes = all.reduce((sum, f) => sum + f.size, 0);

        speedRef.current = { window: [], completedBytes: 0, batchLoaded: {} };

        setState({
            ...INITIAL,
            isUploading: true,
            totalFiles: all.length,
            totalBytes,
        });

        let uploaded = 0;
        let failed = 0;
        let nextIndex = 0;
        let active = 0;
        const errors = [];

        const updateProgress = () => {
            const ref = speedRef.current;
            const inFlightBytes = Object.values(ref.batchLoaded).reduce((s, b) => s + b, 0);
            const totalLoaded = ref.completedBytes + inFlightBytes;
            const speedBps = computeSpeed(totalLoaded);
            const remaining = totalBytes - totalLoaded;
            const etaSeconds = speedBps > 0 ? Math.round(remaining / speedBps) : null;

            setState((prev) => ({
                ...prev,
                loadedBytes: totalLoaded,
                speedBps,
                etaSeconds,
            }));
        };

        const uploadOneBatch = async (batch, index) => {
            const batchBytes = batch.reduce((sum, f) => sum + f.size, 0);
            let attempts = 0;
            const ref = speedRef.current;

            while (true) {
                try {
                    await uploadBatch(
                        uploadUrl,
                        batch,
                        (loaded) => {
                            ref.batchLoaded[index] = loaded;
                            updateProgress();
                        },
                        () => {
                            ref.batchLoaded[index] = batchBytes;
                            updateProgress();
                        },
                    );

                    ref.completedBytes += batchBytes;
                    delete ref.batchLoaded[index];
                    uploaded += batch.length;
                    break;
                } catch (err) {
                    if (!shouldRetryUploadError(err)) {
                        delete ref.batchLoaded[index];
                        failed += batch.length;
                        errors.push(`${batch.map(f => f.name).join(', ')}: ${err.message}`);
                        concurrency = Math.max(1, concurrency - 1);
                        break;
                    }

                    attempts += 1;
                    concurrency = Math.max(1, concurrency - 1);
                    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
                    const retryDelay = offline ? 0 : Math.min(30000, 2000 * attempts);

                    ref.batchLoaded[index] = 0;
                    speedRef.current.window = [];

                    setState((prev) => ({ ...prev, offline, speedBps: 0, etaSeconds: null }));

                    await waitForOnline();
                    if (retryDelay > 0) await delay(retryDelay);

                    setState((prev) => ({ ...prev, offline: false }));
                }
            }

            setState((prev) => ({ ...prev, uploadedFiles: uploaded, failedFiles: failed, errors }));
        };

        await new Promise((resolve) => {
            const startNext = () => {
                if (nextIndex >= uploadItems.length && active === 0) { resolve(); return; }
                while (active < concurrency && nextIndex < uploadItems.length) {
                    const index = nextIndex;
                    const batch = uploadItems[index];
                    nextIndex += 1;
                    active += 1;
                    uploadOneBatch(batch, index).finally(() => { active -= 1; startNext(); });
                }
            };
            startNext();
        });

        setState((prev) => ({
            ...prev,
            isUploading: false,
            isDone: true,
            speedBps: 0,
            etaSeconds: null,
            loadedBytes: totalBytes,
        }));

        setTimeout(() => {
            router.reload({ only: reloadOnly ?? undefined });
            setState(INITIAL);
        }, 1800);
    }, [uploadUrl, batchSize, maxConcurrent, reloadOnly, computeSpeed]);

    const reset = useCallback(() => setState(INITIAL), []);

    return { state, upload, reset };
}
