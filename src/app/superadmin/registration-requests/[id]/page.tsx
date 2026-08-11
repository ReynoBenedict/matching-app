'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

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
          return;
        }

        if (response.status === 404) {
          setError('Permintaan tidak ditemukan');
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          setError(data.error || 'Gagal memuat data');
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9ff', fontFamily: "'Public Sans', sans-serif", color: '#0b1c30', display: 'flex' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-size: inherit; }
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .main-content { margin-left: 0 !important; }
          .header { left: 0 !important; }
        }
      `}</style>

      {/* Sidebar - Same as list page */}
      <aside style={{
        display: 'flex',
        width: '260px',
        height: '100vh',
        backgroundColor: '#002b5a',
        color: '#ffffff',
        padding: '32px 16px',
        position: 'fixed',
        left: 0,
        top: 0,
        borderRight: '1px solid #c3c6d2',
        zIndex: 20,
        flexDirection: 'column'
      }} className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', color: '#002b5a' }}>
            BPS
          </div>
          <div>
            <h1 style={{ fontSize: '14px', fontWeight: '600', margin: '0' }}>Sistem Pencocokan Data</h1>
            <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#b3d9ff' }}>Kota Malang</p>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link
            href="/superadmin/registration-requests"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 16px',
              backgroundColor: '#0c4687',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <span className="material-symbols-outlined">group</span>
            Manajemen Pengguna
          </Link>
        </nav>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 16px',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '13px',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0c4687')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <span className="material-symbols-outlined">logout</span>
            Log Keluar
          </button>
      </aside>

      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: '260px',
        right: 0,
        height: '64px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #c3c6d2',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '24px',
        paddingRight: '24px',
        zIndex: 10
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#002b5a', margin: '0' }}>
          Detail Permintaan
        </h2>
      </header>

      {/* Main */}
      <main style={{ flex: 1, marginTop: '64px', marginLeft: '260px', padding: '32px 24px', width: 'calc(100% - 260px)' }} className="main-content">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Breadcrumbs */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#424750', marginBottom: '24px' }}>
            <Link href="/superadmin/registration-requests" style={{ color: 'inherit', textDecoration: 'none' }}>
              Persetujuan Registrasi
            </Link>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            <span style={{ color: '#002b5a', fontWeight: '600' }}>Detail</span>
          </nav>

          {/* Back Button */}
          <Link
            href="/superadmin/registration-requests"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#006493',
              fontWeight: '600',
              marginBottom: '24px',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Kembali
          </Link>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', paddingTop: '64px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', animation: 'spin 2s linear infinite', display: 'inline-block' }}>hourglass_empty</span>
              <p style={{ marginTop: '16px', color: '#424750' }}>Memuat...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{ backgroundColor: '#ffdad6', border: '1px solid #ba1a1a', color: '#93000a', padding: '16px', borderRadius: '4px', marginBottom: '24px' }}>
              {error}
            </div>
          )}

          {/* Success */}
          {successMessage && (
            <div style={{ backgroundColor: '#e8f5e9', border: '1px solid #4caf50', color: '#2e7d32', padding: '16px', borderRadius: '4px', marginBottom: '24px' }}>
              {successMessage}
            </div>
          )}

          {/* Details */}
          {!loading && request && (
            <>
              {/* Applicant Card */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #c3c6d2', borderRadius: '4px', padding: '24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#002b5a', margin: '0 0 8px 0' }}>
                    {request.fullName}
                  </h1>
                  <p style={{ fontSize: '14px', color: '#424750', margin: '0' }}>
                    {request.email}
                  </p>
                </div>
                <span style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: request.status === 'PENDING' ? '#ffdbcb' : request.status === 'APPROVED' ? '#e8f5e9' : '#ffdad6',
                  color: request.status === 'PENDING' ? '#4e1c00' : request.status === 'APPROVED' ? '#2e7d32' : '#93000a'
                }}>
                  {request.status === 'PENDING' ? 'Menunggu' : request.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                </span>
              </div>

              {/* Information Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                {/* Personal Info */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #c3c6d2', borderRadius: '4px', padding: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#002b5a', marginBottom: '16px', margin: '0 0 16px 0' }}>
                    Informasi Pribadi
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#424750', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Nama Lengkap</label>
                      <p style={{ fontSize: '14px', color: '#002b5a', fontWeight: '600', margin: '0' }}>{request.fullName}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#424750', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Email</label>
                      <p style={{ fontSize: '14px', color: '#002b5a', fontWeight: '600', margin: '0' }}>{request.email}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#424750', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Username</label>
                      <p style={{ fontSize: '14px', color: '#002b5a', fontWeight: '600', margin: '0' }}>{request.username}</p>
                    </div>
                  </div>
                </div>

                {/* Request Info */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #c3c6d2', borderRadius: '4px', padding: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#002b5a', margin: '0 0 16px 0' }}>
                    Informasi Permintaan
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#424750', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Peran Diminta</label>
                      <p style={{ fontSize: '14px', color: '#002b5a', fontWeight: '600', margin: '0' }}>{getRoleLabel(request.requestedRole)}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#424750', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Tanggal Registrasi</label>
                      <p style={{ fontSize: '14px', color: '#002b5a', fontWeight: '600', margin: '0' }}>{formatDate(request.createdAt)}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#424750', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Status</label>
                      <p style={{ fontSize: '14px', color: '#002b5a', fontWeight: '600', margin: '0' }}>
                        {request.status === 'PENDING' ? 'Menunggu' : request.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              {request.status === 'REJECTED' && request.rejectionReason && (
                <div style={{ backgroundColor: '#ffdad6', border: '1px solid #ba1a1a', borderRadius: '4px', padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#93000a', margin: '0 0 12px 0' }}>
                    Alasan Penolakan
                  </h3>
                  <p style={{ fontSize: '14px', color: '#93000a', margin: '0' }}>{request.rejectionReason}</p>
                </div>
              )}

              {/* Actions */}
              {request.status === 'PENDING' && (
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #c3c6d2', borderRadius: '4px', padding: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#002b5a', marginBottom: '24px', margin: '0 0 24px 0' }}>
                    Tindakan
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Approve */}
                    <div style={{ paddingBottom: '24px', borderBottom: '1px solid #c3c6d2' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#002b5a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ color: '#006493' }}>check_circle</span>
                        Setujui
                      </h4>
                      <p style={{ fontSize: '13px', color: '#424750', margin: '0 0 12px 0' }}>
                        Menyetujui akan membuat akun aktif.
                      </p>
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#006493',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          opacity: actionLoading ? 0.7 : 1,
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => !actionLoading && (e.currentTarget.style.backgroundColor = '#004668')}
                        onMouseLeave={(e) => !actionLoading && (e.currentTarget.style.backgroundColor = '#006493')}
                      >
                        {actionLoading ? 'Memproses...' : 'Setujui'}
                      </button>
                    </div>

                    {/* Reject */}
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#002b5a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ color: '#ba1a1a' }}>cancel</span>
                        Tolak
                      </h4>
                      <p style={{ fontSize: '13px', color: '#424750', margin: '0 0 12px 0' }}>
                        Tolak permintaan ini.
                      </p>
                      {!showRejectForm ? (
                        <button
                          onClick={() => setShowRejectForm(true)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#ba1a1a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#8b1538')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ba1a1a')}
                        >
                          Tolak
                        </button>
                      ) : (
                        <div style={{ backgroundColor: '#f5f5f5', border: '1px solid #ba1a1a', borderRadius: '4px', padding: '16px', marginTop: '12px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#0b1c30', display: 'block', marginBottom: '8px' }}>
                            Alasan (Opsional)
                          </label>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Jelaskan alasannya..."
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '1px solid #c3c6d2',
                              borderRadius: '4px',
                              fontSize: '14px',
                              fontFamily: "'Public Sans', sans-serif",
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                            rows={4}
                          />
                          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                            <button
                              onClick={handleReject}
                              disabled={actionLoading}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#ba1a1a',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                opacity: actionLoading ? 0.7 : 1
                              }}
                            >
                              {actionLoading ? 'Memproses...' : 'Konfirmasi'}
                            </button>
                            <button
                              onClick={() => {
                                setShowRejectForm(false);
                                setRejectionReason('');
                              }}
                              disabled={actionLoading}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#ffffff',
                                color: '#002b5a',
                                border: '1px solid #c3c6d2',
                                borderRadius: '4px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                opacity: actionLoading ? 0.7 : 1
                              }}
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
                <div style={{ backgroundColor: '#eff4ff', border: '1px solid #006493', borderRadius: '4px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#006493' }}>info</span>
                  <p style={{ fontSize: '14px', color: '#004668', margin: '0' }}>
                    Permintaan ini telah {request.status === 'APPROVED' ? 'disetujui' : 'ditolak'}.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
