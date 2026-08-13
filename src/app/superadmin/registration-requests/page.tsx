'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
}

export default function RegistrationRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('persetujuan'); // 'daftar' or 'persetujuan'
  const [requestStatus, setRequestStatus] = useState('PENDING'); // PENDING, APPROVED, REJECTED

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `/api/superadmin/registration-requests?status=${requestStatus}`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (response.status === 403) {
          setError('Anda tidak memiliki akses ke halaman ini');
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          setError(data.error || 'Gagal memuat permintaan');
          return;
        }

        setRequests(data.data || []);
      } catch {
        setError('Terjadi kesalahan saat memuat data');
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'persetujuan') {
      fetchRequests();
    }
  }, [activeTab, requestStatus, router]);

  const filteredRequests = requests.filter(
    (req) =>
      req.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AuthenticatedLayout pageTitle="Persetujuan Registrasi Pengguna">
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Breadcrumbs */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#424750', marginBottom: '24px' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>
              Manajemen Pengguna
            </a>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            <span style={{ color: '#002b5a', fontWeight: '600' }}>Persetujuan Registrasi</span>
          </nav>

          {/* Page Header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#002b5a', margin: '0 0 8px 0' }}>
              Persetujuan Registrasi Pengguna
            </h1>
            <p style={{ fontSize: '14px', color: '#424750', margin: '0', maxWidth: '600px' }}>
              Kelola permintaan akses baru ke Sistem Pencocokan Data.
            </p>
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #c3c6d2', marginBottom: '24px', gap: '0' }}>
            <button
              onClick={() => setActiveTab('daftar')}
              style={{
                padding: '12px 24px',
                fontSize: '12px',
                fontWeight: '600',
                border: 'none',
                backgroundColor: activeTab === 'daftar' ? '#eff4ff' : 'transparent',
                color: activeTab === 'daftar' ? '#002b5a' : '#424750',
                borderBottom: activeTab === 'daftar' ? '2px solid #002b5a' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Daftar Pengguna
            </button>
            <button
              onClick={() => setActiveTab('persetujuan')}
              style={{
                padding: '12px 24px',
                fontSize: '12px',
                fontWeight: '600',
                border: 'none',
                backgroundColor: activeTab === 'persetujuan' ? '#eff4ff' : 'transparent',
                color: activeTab === 'persetujuan' ? '#002b5a' : '#424750',
                borderBottom: activeTab === 'persetujuan' ? '2px solid #002b5a' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Persetujuan Registrasi
            </button>
          </div>

          {activeTab === 'daftar' && (
            <DaftarPenggunaTab />
          )}

          {activeTab === 'persetujuan' && (
            <>
            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #c3c6d2', marginBottom: '24px', gap: '0' }}>
              {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setRequestStatus(status)}
                  style={{
                    padding: '12px 24px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: 'none',
                    backgroundColor: requestStatus === status ? '#eff4ff' : 'transparent',
                    color: requestStatus === status ? '#002b5a' : '#424750',
                    borderBottom: requestStatus === status ? '2px solid #002b5a' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {status === 'PENDING' ? 'Menunggu Persetujuan' : status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                </button>
              ))}
            </div>

          {/* Search and Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', backgroundColor: '#ffffff', border: '1px solid #c3c6d2', borderRadius: '4px 4px 0 0', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#424750', fontSize: '18px', pointerEvents: 'none' }}>
                  search
                </span>
                <input
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '16px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    border: '1px solid #c3c6d2',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <button
                style={{
                  background: 'none',
                  border: '1px solid #c3c6d2',
                  borderRadius: '4px',
                  color: '#424750',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span className="material-symbols-outlined">filter_list</span>
              </button>
              <div style={{ backgroundColor: '#eff4ff', color: '#002b5a', fontSize: '12px', fontWeight: '600', padding: '8px 16px', borderRadius: '4px', border: '1px solid #c3c6d2', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                Total: {filteredRequests.length}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ backgroundColor: '#ffdad6', border: '1px solid #ba1a1a', color: '#93000a', padding: '16px', borderRadius: '4px', marginBottom: '24px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', paddingTop: '64px', color: '#424750' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', animation: 'spin 2s linear infinite', display: 'inline-block' }}>hourglass_empty</span>
              <p style={{ marginTop: '16px' }}>Memuat data...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredRequests.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: '64px', backgroundColor: '#ffffff', border: '1px solid #c3c6d2', borderRadius: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#c3c6d2', display: 'inline-block' }}>inbox</span>
              <p style={{ color: '#424750', marginTop: '16px', fontSize: '14px' }}>
                Tidak ada permintaan registrasi
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && filteredRequests.length > 0 && (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #c3c6d2', borderRadius: '0 0 4px 4px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#eff4ff', borderBottom: '1px solid #c3c6d2' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#424750', textAlign: 'left' }}>Nama Pemohon</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#424750', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#424750', textAlign: 'left' }}>Peran Diminta</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#424750', textAlign: 'left' }}>Tanggal Registrasi</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#424750', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#424750', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request, idx) => (
                      <tr
                        key={request.id}
                        style={{
                          borderTop: idx > 0 ? '1px solid #c3c6d2' : 'none',
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9ff',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8f9ff')}
                      >
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#002b5a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: '#dce9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#002b5a' }}>
                              {request.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            {request.fullName}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#424750' }}>
                          {request.email}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', backgroundColor: '#dce9ff', color: '#002b5a' }}>
                            {request.requestedRole === 'ADMIN' ? 'Superadmin' : request.requestedRole === 'EMPLOYEE' ? 'Employee' : request.requestedRole === 'HEAD' ? 'Kepala BPS' : 'Petugas Verifikasi'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#424750' }}>
                          {formatDate(request.createdAt)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {request.status === 'PENDING' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ffdbcb', color: '#4e1c00', padding: '2px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', border: '1px solid #ffb693' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }}></span>
                              Pending Verification
                            </span>
                          )}
                          {request.status === 'APPROVED' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '2px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', border: '1px solid #4caf50' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4caf50', display: 'inline-block' }}></span>
                              Disetujui
                            </span>
                          )}
                          {request.status === 'REJECTED' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ffdad6', color: '#93000a', padding: '2px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', border: '1px solid #ba1a1a' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ba1a1a', display: 'inline-block' }}></span>
                              Ditolak
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {request.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => {
                                  // Reject action - placeholder
                                  console.log('Reject:', request.id);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#ba1a1a',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  textDecoration: 'none',
                                  padding: '0',
                                  transition: 'text-decoration 0.2s'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                              >
                                Tolak
                              </button>
                              <Link
                                href={`/superadmin/registration-requests/${request.id}`}
                                style={{
                                  display: 'inline-block',
                                  padding: '6px 12px',
                                  backgroundColor: '#16a34a',
                                  color: '#ffffff',
                                  borderRadius: '4px',
                                  textDecoration: 'none',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  transition: 'background-color 0.2s',
                                  cursor: 'pointer',
                                  border: 'none'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#15803d')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
                              >
                                Detail
                              </Link>
                            </>
                          )}
                          {(request.status === 'APPROVED' || request.status === 'REJECTED') && (
                            <Link
                              href={`/superadmin/registration-requests/${request.id}`}
                              style={{
                                display: 'inline-block',
                                padding: '6px 12px',
                                backgroundColor: '#002b5a',
                                color: '#ffffff',
                                borderRadius: '4px',
                                textDecoration: 'none',
                                fontSize: '12px',
                                fontWeight: '600',
                                transition: 'background-color 0.2s',
                                cursor: 'pointer',
                                border: 'none'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0c4687')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#002b5a')}
                            >
                              Detail
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </AuthenticatedLayout>
    );
  }
  
  function DaftarPenggunaTab() {
  const [users, setUsers] = useState<Array<{ id: number; fullName: string; email: string; username: string; role: string; status: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `/api/superadmin/users`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );

        if (response.status === 401 || response.status === 403) {
          setError('Anda tidak memiliki akses');
          setLoading(false);
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          setError(data.error || 'Gagal memuat pengguna');
          setLoading(false);
          return;
        }

        setUsers(data.data || []);
        setLoading(false);
      } catch {
        setError('Terjadi kesalahan saat memuat data');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
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
    <>
      {/* Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', backgroundColor: '#ffffff', border: '1px solid #c3c6d2', borderRadius: '4px 4px 0 0', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#424750', fontSize: '18px', pointerEvents: 'none' }}>
              search
            </span>
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '16px',
                paddingTop: '8px',
                paddingBottom: '8px',
                border: '1px solid #c3c6d2',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ backgroundColor: '#eff4ff', color: '#002b5a', fontSize: '12px', fontWeight: '600', padding: '8px 16px', borderRadius: '4px', border: '1px solid #c3c6d2', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            Total: {filteredUsers.length}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#ffdad6', border: '1px solid #ba1a1a', color: '#93000a', padding: '16px', borderRadius: '4px', marginBottom: '24px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', paddingTop: '64px', color: '#424750' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '40px', animation: 'spin 2s linear infinite', display: 'inline-block' }}>hourglass_empty</span>
          <p style={{ marginTop: '16px' }}>Memuat data...</p>
        </div>
      )}

      {!loading && filteredUsers.length === 0 && (
        <div style={{ textAlign: 'center', paddingTop: '64px', backgroundColor: '#ffffff', border: '1px solid #c3c6d2', borderRadius: '4px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#c3c6d2', display: 'inline-block' }}>people</span>
          <p style={{ color: '#424750', marginTop: '16px', fontSize: '14px' }}>
            Tidak ada pengguna aktif
          </p>
        </div>
      )}

      {!loading && filteredUsers.length > 0 && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #c3c6d2', borderRadius: '0 0 4px 4px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#eff4ff', borderBottom: '1px solid #c3c6d2' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#424750', textAlign: 'left' }}>Nama Lengkap</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#424750', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#424750', textAlign: 'left' }}>Username</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#424750', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#424750', textAlign: 'left' }}>Tanggal Bergabung</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => (
                  <tr
                    key={user.id}
                    style={{
                      borderTop: idx > 0 ? '1px solid #c3c6d2' : 'none',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9ff',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8f9ff')}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#002b5a' }}>
                      {user.fullName}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#424750' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#424750' }}>
                      {user.username}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', backgroundColor: '#dce9ff', color: '#002b5a' }}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#424750' }}>
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
