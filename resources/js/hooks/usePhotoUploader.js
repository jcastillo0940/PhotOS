import { router } from '@inertiajs/react';
import { useState, useCallback, useEffect } from 'react';

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
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.upload.onloadend = () => {
            onServerProcessing();
        };
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
    currentBatch: 0,
    totalBatches: 0,
    batchProgress: 0,
    statusMessage: '',
    errors: [],
};

const CF_MAX_BYTES = 90 * 1024 * 1024; // 90 MB — Cloudflare rejects requests over 100 MB

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

export function usePhotoUploader({ uploadUrl, batchSize = 1, reloadOnly = null }) {
    const [state, setState] = useState(INITIAL);

    useEffect(() => {
        if (!state.isUploading) return undefined;

        const warnBeforeClose = (event) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', warnBeforeClose);

        return () => window.removeEventListener('beforeunload', warnBeforeClose);
    }, [state.isUploading]);

    const upload = useCallback(async (files) => {
        if (!files?.length) return;

        const all = Array.from(files);

        const oversized = all.filter((f) => f.size > CF_MAX_BYTES);
        if (oversized.length > 0) {
            const names = oversized.map((f) => `${f.name} (${(f.size / 1048576).toFixed(0)} MB)`).join(', ');
            setState({
                ...INITIAL,
                isDone: true,
                failedFiles: oversized.length,
                errors: [`Fotos demasiado grandes para subir (límite 90 MB): ${names}`],
                statusMessage: `${oversized.length} foto${oversized.length !== 1 ? 's' : ''} superan el límite de 90 MB`,
            });
            return;
        }

        const batches = [];
        for (let i = 0; i < all.length; i += batchSize) batches.push(all.slice(i, i + batchSize));

        setState({
            ...INITIAL,
            isUploading: true,
            totalFiles: all.length,
            totalBatches: batches.length,
            statusMessage: `Preparando ${all.length} foto${all.length !== 1 ? 's' : ''}...`,
        });

        let uploaded = 0;
        let failed = 0;
        const errors = [];

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const from = i * batchSize + 1;
            const to = Math.min(from + batchSize - 1, all.length);
            const range = from === to ? `foto ${from}` : `fotos ${from}–${to}`;
            const loteInfo = batches.length > 1 ? ` · Lote ${i + 1} de ${batches.length}` : '';

            setState((prev) => ({
                ...prev,
                currentBatch: i + 1,
                batchProgress: 0,
                statusMessage: `Subiendo ${range} de ${all.length}${loteInfo}`,
            }));

            let attempts = 0;

            while (true) {
                try {
                    await uploadBatch(
                        uploadUrl,
                        batch,
                        (pct) => {
                            setState((prev) => ({ ...prev, batchProgress: pct }));
                        },
                        () => {
                            setState((prev) => ({
                                ...prev,
                                batchProgress: 100,
                                statusMessage: `Procesando ${range} en servidor${loteInfo}...`,
                            }));
                        },
                    );
                    uploaded += batch.length;
                    break;
                } catch (err) {
                    if (!shouldRetryUploadError(err)) {
                        failed += batch.length;
                        errors.push(`Lote ${i + 1}: ${err.message}`);
                        break;
                    }

                    attempts += 1;
                    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
                    const retryDelay = offline ? 0 : Math.min(30000, 2000 * attempts);

                    setState((prev) => ({
                        ...prev,
                        batchProgress: 0,
                        statusMessage: offline
                            ? `Conexion perdida. La subida continuara cuando vuelva internet (${range}).`
                            : `Conexion inestable. Reintentando ${range} en ${Math.ceil(retryDelay / 1000)}s...`,
                    }));

                    await waitForOnline();
                    if (retryDelay > 0) await delay(retryDelay);
                }
            }

            setState((prev) => ({ ...prev, uploadedFiles: uploaded, failedFiles: failed, errors }));
        }

        const msg = failed > 0
            ? `${uploaded} subidas, ${failed} fallaron`
            : `${uploaded} foto${uploaded !== 1 ? 's' : ''} subida${uploaded !== 1 ? 's' : ''} correctamente`;

        setState((prev) => ({ ...prev, isUploading: false, isDone: true, statusMessage: msg }));

        setTimeout(() => {
            router.reload({ only: reloadOnly ?? undefined });
            setState(INITIAL);
        }, 1500);
    }, [uploadUrl, batchSize, reloadOnly]);

    const reset = useCallback(() => setState(INITIAL), []);

    return { state, upload, reset };
}
