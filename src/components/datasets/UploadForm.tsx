'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [datasetType, setDatasetType] = useState('DB_KENDEDES');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [progress, setProgress] = useState(0);

  const datasetTypes = [
    { value: 'DB_KENDEDES', label: 'Database Kendedes' },
    { value: 'DIR_PAJAK', label: 'Direktori Pajak' },
    { value: 'OSS_BADAN_USAHA', label: 'OSS - Badan Usaha' },
    { value: 'OSS_PERORANGAN', label: 'OSS - Perorangan' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Hanya file CSV yang didukung');
        setFile(null);
        return;
      }

      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('Ukuran file tidak boleh melebihi 50MB');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError('Silakan pilih file CSV');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('datasetType', datasetType);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setProgress(percentComplete);
        }
      });

      // Setup promise for XHR
      const uploadPromise = new Promise<{
        success: boolean;
        datasetId?: number;
        error?: string;
        message?: string;
      }>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 201) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            const response = JSON.parse(xhr.responseText);
            reject(new Error(response.error || 'Upload gagal'));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Upload gagal'));
        };

        xhr.open('POST', '/api/datasets/upload');
        xhr.send(formData);
      });

      const result = await uploadPromise;

      if (result.success) {
        setSuccess(`Dataset berhasil diunggah! ${result.message || ''}`);
        setFile(null);
        setProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Redirect to dataset detail or list
        setTimeout(() => {
          if (result.datasetId) {
            router.push(`/datasets/${result.datasetId}`);
          } else {
            router.push('/datasets');
          }
        }, 1000);
      } else {
        setError(result.message || 'Upload gagal');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload gagal');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-lg">
        {/* Error Message */}
        {error && (
          <div className="bg-error-container border border-error rounded p-md">
            <p className="font-body-md text-body-md text-on-error-container">
              {error}
            </p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-500 rounded p-md">
            <p className="font-body-md text-body-md text-green-900">
              {success}
            </p>
          </div>
        )}

        {/* Dataset Type Selection */}
        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-md">
            Tipe Dataset <span className="text-error">*</span>
          </label>
          <select
            value={datasetType}
            onChange={(e) => setDatasetType(e.target.value)}
            disabled={loading}
            className="w-full px-md py-md border border-outline-variant rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
          >
            {datasetTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-sm">
            Pilih tipe dataset yang sesuai dengan data yang akan diunggah
          </p>
        </div>

        {/* File Upload */}
        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-md">
            File Dataset (CSV) <span className="text-error">*</span>
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-xl text-center cursor-pointer transition-colors ${
              file
                ? 'border-primary bg-primary-container/10'
                : 'border-outline-variant hover:border-primary'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
              className="hidden"
            />

            {file ? (
              <div>
                <div className="text-3xl mb-md">✓</div>
                <p className="font-body-md text-body-md text-on-surface font-semibold">
                  {file.name}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-sm">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="font-label-md text-label-md text-primary mt-md">
                  Klik untuk ubah file
                </p>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-md">📁</div>
                <p className="font-body-md text-body-md text-on-surface mb-sm">
                  Klik atau drag file CSV ke sini
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Format: CSV | Ukuran maksimal: 50MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {loading && progress > 0 && (
          <div>
            <div className="flex justify-between items-center mb-sm">
              <span className="font-label-md text-label-md text-on-surface">
                Progres Upload
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-outline-variant rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-md pt-md border-t border-outline-variant">
          <button
            type="button"
            onClick={() => {
              setFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              setError('');
              setSuccess('');
            }}
            disabled={loading || !file}
            className="flex-1 px-lg py-md bg-surface-container text-on-surface border border-outline-variant rounded font-label-md text-label-md hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!file || loading}
            className="flex-1 px-lg py-md bg-primary text-on-primary rounded font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Mengunggah...</span>
              </>
            ) : (
              <>
                <span>📤</span>
                <span>Unggah Dataset</span>
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="bg-surface-container rounded p-md">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            <strong>Informasi:</strong> File CSV harus memiliki header yang sesuai dengan skema dataset. Ukuran maksimal file adalah 50MB.
          </p>
        </div>
      </form>
    </div>
  );
}
