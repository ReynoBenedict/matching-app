'use client';

import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout';
import { UploadForm } from '@/components/datasets/UploadForm';

export default function UploadDatasetPage() {
  return (
    <AuthenticatedLayout pageTitle="Upload Dataset Baru">
      {/* Page Header */}
      <div className="mb-xl">
        <h2 className="font-headline-lg text-on-surface mb-xs">Unggah Dataset Baru</h2>
        <p className="font-body-md text-on-surface-variant">
          Proses unggah, validasi, dan integrasi data sensus ke dalam sistem utama BPS.
        </p>
      </div>

      {/* Multi-step Progress */}
      <div className="mb-xl flex items-center justify-between w-full relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-container-high -z-10"></div>
        <div className="flex flex-col items-center gap-sm bg-background px-sm">
          <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md shadow-sm">
            1
          </div>
          <span className="font-label-md text-primary">Upload</span>
        </div>
        <div className="flex flex-col items-center gap-sm bg-background px-sm">
          <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-label-md border border-outline-variant">
            2
          </div>
          <span className="font-label-md text-on-surface-variant">Validation</span>
        </div>
        <div className="flex flex-col items-center gap-sm bg-background px-sm">
          <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-label-md border border-outline-variant">
            3
          </div>
          <span className="font-label-md text-on-surface-variant">Preview</span>
        </div>
        <div className="flex flex-col items-center gap-sm bg-background px-sm">
          <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-label-md border border-outline-variant">
            4
          </div>
          <span className="font-label-md text-on-surface-variant">Confirm</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Main Upload Form Area */}
        <div className="lg:col-span-2 flex flex-col gap-lg">
          <div className="bg-surface border border-outline-variant rounded p-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-headline-sm text-on-surface mb-md">Informasi Dataset</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-on-surface-variant" htmlFor="dataset_name">
                  Nama Dataset
                </label>
                <input
                  className="w-full border border-outline rounded bg-surface px-md py-sm font-body-md text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all"
                  id="dataset_name"
                  placeholder="Misal: Sensus Penduduk Malang 2024"
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-on-surface-variant" htmlFor="dataset_source">
                  Sumber Data
                </label>
                <select
                  className="w-full border border-outline rounded bg-surface px-md py-sm font-body-md text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all"
                  id="dataset_source"
                >
                  <option>BPS Provinsi</option>
                  <option>Dinas Dukcapil</option>
                  <option>Survei Internal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Upload Form Component */}
          <UploadForm />
        </div>

        {/* Side Panel / Validation Feedback */}
        <div className="flex flex-col gap-lg">
          <div className="bg-surface border border-outline-variant rounded p-lg shadow-sm">
            <h3 className="font-headline-sm text-on-surface mb-md">Status Validasi</h3>
            <div className="flex flex-col gap-md">
              <div className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-secondary text-[20px] mt-[2px]">check_circle</span>
                <div>
                  <p className="font-label-md text-on-surface">Struktur File Valid</p>
                  <p className="font-body-sm text-on-surface-variant">Format CSV terdeteksi dengan benar.</p>
                </div>
              </div>
              <div className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-secondary text-[20px] mt-[2px]">info</span>
                <div>
                  <p className="font-label-md text-on-surface">Ringkasan Data</p>
                  <ul className="font-body-sm text-on-surface-variant list-disc pl-md mt-xs">
                    <li>Format: CSV atau XLSX</li>
                    <li>Maksimal: 500MB</li>
                    <li>Encoding: UTF-8</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-md">
            <Link
              href="/datasets"
              className="w-full text-center bg-surface text-primary border border-primary font-label-md px-lg py-sm rounded hover:bg-surface-container-low transition-colors"
            >
              Batal
            </Link>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
