'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout';

interface RegistrationRequest {
  id: number;
  fullName: string;
  email: string;
  username: string;
  requestedRole: string;
  status: string;
  createdAt: string;
  rejectionReason?: string;
}

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [request, setRequest] = useState<RegistrationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchRequest = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/superadmin/registration-requests/${id}`);

        if (response.status === 401) {
          router.push('/login');
          return;
        }
        if (response.status === 403) {
          setError('Anda tidak memiliki akses');
          setLoading(false);
          return;
        }
        if (response.status === 404) {
          setError('Permintaan tidak ditemukan');
          setLoading(false);
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          setError(data.error || 'Gagal memuat data');
          setLoading(false);
          return;
        }

        setRequest(data.data);
      } catch {
        setError('Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, router]);

  const handleApprove = async () => {
    if (!request || request.status !== 'PENDING') return;

    try {
      setActionLoading(true);
      setError('');

      const response = await fetch(`/api/superadmin/registration-requests/${request.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Gagal menyetujui');
        return;
      }

      setSuccessMessage('Registrasi disetujui. Pengguna dapat login sekarang.');
      setRequest({ ...request, status: 'APPROVED' });
      setTimeout(() => router.push('/superadmin/registration-requests'), 2000);
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!request || request.status !== 'PENDING') return;

    try {
      setActionLoading(true);
      setError('');

      const response = await fetch(`/api/superadmin/registration-requests/${request.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectionReason }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Gagal menolak');
        return;
      }

      setSuccessMessage('Registrasi ditolak.');
      setRequest({ ...request, status: 'REJECTED' });
      setShowRejectForm(false);
      setTimeout(() => router.push('/superadmin/registration-requests'), 2000);
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Superadmin';
      case 'EMPLOYEE': return 'Employee';
      case 'HEAD': return 'Kepala BPS';
      case 'VERIFICATION_OFFICER': return 'Petugas Verifikasi';
      default: return role;
    }
  };

  return (
    <AuthenticatedLayout pageTitle="Detail Permintaan Registrasi">
      <div style={{ maxWidth: '800px' }}>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-6">
          <Link
            href="/superadmin/registration-requests"
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            Manajemen Pengguna
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <Link
            href="/superadmin/registration-requests"
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            Persetujuan Registrasi
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-semibold">Detail</span>
        </nav>

        {/* Back Button */}
        <Link
          href="/superadmin/registration-requests"
          className="inline-flex items-center gap-2 text-secondary font-semibold text-sm mb-6 hover:underline"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </Link>

        {/* Loading */}
        {loading && (
          <div className="text-center pt-16">
            <span
              className="material-symbols-outlined text-[40px] inline-block"
              style={{ animation: 'spin 2s linear infinite' }}
            >
              hourglass_empty
            </span>
            <p className="mt-4 text-on-surface-variant text-sm">Memuat...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-error-container border border-error text-on-error-container p-4 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div className="p-4 rounded mb-6 text-sm border" style={{ backgroundColor: '#e8f5e9', borderColor: '#4caf50', color: '#2e7d32' }}>
            {successMessage}
          </div>
        )}

        {/* Detail content */}
        {!loading && request && (
          <>
            {/* Applicant Header Card */}
            <div className="bg-surface border border-outline-variant rounded p-6 mb-6 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-primary mb-1">{request.fullName}</h1>
                <p className="text-sm text-on-surface-variant">{request.email}</p>
              </div>
              <span
                className="inline-block px-4 py-2 rounded text-xs font-semibold"
                style={{
                  backgroundColor:
                    request.status === 'PENDING'
                      ? '#ffdbcb'
                      : request.status === 'APPROVED'
                      ? '#e8f5e9'
                      : '#ffdad6',
                  color:
                    request.status === 'PENDING'
                      ? '#4e1c00'
                      : request.status === 'APPROVED'
                      ? '#2e7d32'
                      : '#93000a',
                }}
              >
                {request.status === 'PENDING'
                  ? 'Menunggu'
                  : request.status === 'APPROVED'
                  ? 'Disetujui'
                  : 'Ditolak'}
              </span>
            </div>

            {/* Information grid */}
            <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

              {/* Personal Info */}
              <div className="bg-surface border border-outline-variant rounded p-6">
                <h3 className="text-sm font-semibold text-primary mb-4">Informasi Pribadi</h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs text-on-surface-variant font-semibold block mb-1">Nama Lengkap</label>
                    <p className="text-sm text-primary font-semibold">{request.fullName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant font-semibold block mb-1">Email</label>
                    <p className="text-sm text-primary font-semibold">{request.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant font-semibold block mb-1">Username</label>
                    <p className="text-sm text-primary font-semibold">{request.username}</p>
                  </div>
                </div>
              </div>

              {/* Request Info */}
              <div className="bg-surface border border-outline-variant rounded p-6">
                <h3 className="text-sm font-semibold text-primary mb-4">Informasi Permintaan</h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs text-on-surface-variant font-semibold block mb-1">Peran Diminta</label>
                    <p className="text-sm text-primary font-semibold">{getRoleLabel(request.requestedRole)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant font-semibold block mb-1">Tanggal Registrasi</label>
                    <p className="text-sm text-primary font-semibold">{formatDate(request.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant font-semibold block mb-1">Status</label>
                    <p className="text-sm text-primary font-semibold">
                      {request.status === 'PENDING'
                        ? 'Menunggu'
                        : request.status === 'APPROVED'
                        ? 'Disetujui'
                        : 'Ditolak'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rejection reason (if applicable) */}
            {request.status === 'REJECTED' && request.rejectionReason && (
              <div className="bg-error-container border border-error rounded p-6 mb-6">
                <h3 className="text-sm font-semibold text-on-error-container mb-3">Alasan Penolakan</h3>
                <p className="text-sm text-on-error-container">{request.rejectionReason}</p>
              </div>
            )}

            {/* Actions (only for PENDING) */}
            {request.status === 'PENDING' && (
              <div className="bg-surface border border-outline-variant rounded p-6">
                <h3 className="text-sm font-semibold text-primary mb-6">Tindakan</h3>
                <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>

                  {/* Approve */}
                  <div className="pb-6 border-b border-outline-variant">
                    <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                      Setujui
                    </h4>
                    <p className="text-xs text-on-surface-variant mb-3">
                      Menyetujui akan membuat akun aktif dan pengguna dapat login.
                    </p>
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="px-5 py-2 bg-secondary text-on-secondary rounded text-sm font-semibold hover:bg-on-secondary-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? 'Memproses...' : 'Setujui'}
                    </button>
                  </div>

                  {/* Reject */}
                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-error text-[18px]">cancel</span>
                      Tolak
                    </h4>
                    <p className="text-xs text-on-surface-variant mb-3">Tolak permintaan registrasi ini.</p>

                    {!showRejectForm ? (
                      <button
                        onClick={() => setShowRejectForm(true)}
                        className="px-5 py-2 bg-error text-on-error rounded text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        Tolak
                      </button>
                    ) : (
                      <div className="bg-surface-container-low border border-error rounded p-4 mt-3">
                        <label className="text-xs font-semibold text-on-surface block mb-2">
                          Alasan (Opsional)
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Jelaskan alasannya..."
                          className="w-full p-3 border border-outline-variant rounded text-sm outline-none focus:border-primary bg-surface resize-none"
                          rows={4}
                        />
                        <div className="flex gap-3 mt-3">
                          <button
                            onClick={handleReject}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-error text-on-error rounded text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                          >
                            {actionLoading ? 'Memproses...' : 'Konfirmasi'}
                          </button>
                          <button
                            onClick={() => { setShowRejectForm(false); setRejectionReason(''); }}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-surface text-primary border border-outline-variant rounded text-sm font-semibold disabled:opacity-60 hover:bg-surface-container-low transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Info for non-pending */}
            {request.status !== 'PENDING' && (
              <div className="bg-surface-container-low border border-secondary rounded p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-[20px]">info</span>
                <p className="text-sm text-on-secondary-container">
                  Permintaan ini telah{' '}
                  {request.status === 'APPROVED' ? 'disetujui' : 'ditolak'}.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
