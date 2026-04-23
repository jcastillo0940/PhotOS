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

    useEffect(() => {
        if (!state.isUploading) return undefined;

        const warnBeforeClose = (event) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', warnBeforeClose);

        return () => window.removeEventListener('beforeunload', warnBeforeClose);
    }, [state.isUploading]);

    useEffect(() => {
        if (!state.isUploading || !navigator?.wakeLock?.request) return undefined;

        let lock = null;
        let cancelled = false;

        navigator.wakeLock.request('screen')
            .then((nextLock) => {
                if (cancelled) {
                    nextLock.release().catch(() => {});
                    return;
                }
                lock = nextLock;
            })
            .catch(() => {});

        return () => {
            cancelled = true;
            if (lock) lock.release().catch(() => {});
        };
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
                errors: [`Fotos demasiado grandes para subir (limite 90 MB): ${names}`],
                statusMessage: `${oversized.length} foto${oversized.length !== 1 ? 's' : ''} superan el limite de 90 MB`,
            });
            return;
        }

        const uploadItems = makeUploadBatches(all, batchSize);
        let concurrency = Math.min(initialConcurrency(maxConcurrent), uploadItems.length);

        setState({
            ...INITIAL,
            isUploading: true,
            totalFiles: all.length,
            totalBatches: uploadItems.length,
            statusMessage: `Preparando ${all.length} foto${all.length !== 1 ? 's' : ''} en ${uploadItems.length} lote${uploadItems.length !== 1 ? 's' : ''}...`,
        });

        let uploaded = 0;
        let failed = 0;
        let nextIndex = 0;
        let active = 0;
        const errors = [];

        const uploadOneBatch = async (batch, index) => {
            const batchNumber = index + 1;
            const batchLabel = batch.length === 1
                ? `lote ${batchNumber} (${batch[0].name})`
                : `lote ${batchNumber} (${batch.length} fotos)`;
            let attempts = 0;

            while (true) {
                try {
                    await uploadBatch(
                        uploadUrl,
                        batch,
                        (pct) => {
                            setState((prev) => ({
                                ...prev,
                                currentBatch: batchNumber,
                                batchProgress: pct,
                                statusMessage: `Subiendo ${batchLabel}... ${active} lote${active !== 1 ? 's' : ''} en paralelo`,
                            }));
                        },
                        () => {
                            setState((prev) => ({
                                ...prev,
                                currentBatch: batchNumber,
                                batchProgress: 100,
                                statusMessage: `Procesando ${batchLabel} en servidor...`,
                            }));
                        },
                    );
                    uploaded += batch.length;
                    break;
                } catch (err) {
                    if (!shouldRetryUploadError(err)) {
                        failed += batch.length;
                        errors.push(`${batchLabel}: ${err.message}`);
                        concurrency = Math.max(1, concurrency - 1);
                        break;
                    }

                    attempts += 1;
                    concurrency = Math.max(1, concurrency - 1);
                    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
                    const retryDelay = offline ? 0 : Math.min(30000, 2000 * attempts);

                    setState((prev) => ({
                        ...prev,
                        batchProgress: 0,
                        statusMessage: offline
                            ? 'Conexion perdida. Continuara cuando vuelva internet.'
                            : `Conexion inestable. Reintentando ${batchLabel} en ${Math.ceil(retryDelay / 1000)}s...`,
                    }));

                    await waitForOnline();
                    if (retryDelay > 0) await delay(retryDelay);
                }
            }

            setState((prev) => ({ ...prev, uploadedFiles: uploaded, failedFiles: failed, errors }));
        };

        await new Promise((resolve) => {
            const startNext = () => {
                if (nextIndex >= uploadItems.length && active === 0) {
                    resolve();
                    return;
                }

                while (active < concurrency && nextIndex < uploadItems.length) {
                    const index = nextIndex;
                    const batch = uploadItems[index];
                    nextIndex += 1;
                    active += 1;

                    uploadOneBatch(batch, index)
                        .finally(() => {
                            active -= 1;
                            startNext();
                        });
                }
            };

            startNext();
        });

        const msg = failed > 0
            ? `${uploaded} subidas, ${failed} fallaron`
            : `${uploaded} original${uploaded !== 1 ? 'es' : ''} subido${uploaded !== 1 ? 's' : ''}. El servidor seguira procesando; ya puedes cerrar esta pantalla.`;

        setState((prev) => ({ ...prev, isUploading: false, isDone: true, statusMessage: msg }));

        setTimeout(() => {
            router.reload({ only: reloadOnly ?? undefined });
            setState(INITIAL);
        }, 1500);
    }, [uploadUrl, batchSize, maxConcurrent, reloadOnly]);

    const reset = useCallback(() => setState(INITIAL), []);

    return { state, upload, reset };
}
