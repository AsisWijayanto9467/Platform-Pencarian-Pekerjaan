import React, { useState, useEffect } from 'react';
import SocietyLayouts from '../layouts/SocietyLayouts';
import api from '../../services/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/society/dashboard');
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") || "0";
  };


  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return { icon: 'fa-check-circle', color: '#155724', bg: '#d4edda', label: 'Diterima' };
      case 'rejected':
        return { icon: 'fa-times-circle', color: '#721c24', bg: '#f8d7da', label: 'Ditolak' };
      case 'pending':
        return { icon: 'fa-clock', color: '#856404', bg: '#fff3cd', label: 'Tertunda' };
      default:
        return { icon: 'fa-clock', color: '#856404', bg: '#fff3cd', label: status || '-' };
    }
  };

  const getValidationStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return { icon: 'fa-check-circle', color: '#155724', bg: '#d4edda', label: 'Tervalidasi' };
      case 'declined':
        return { icon: 'fa-times-circle', color: '#721c24', bg: '#f8d7da', label: 'Ditolak' };
      case 'pending':
        return { icon: 'fa-clock', color: '#856404', bg: '#fff3cd', label: 'Menunggu Validasi' };
      default:
        return { icon: 'fa-question-circle', color: '#6c757d', bg: '#e9ecef', label: 'Belum Validasi' };
    }
  };

  const StatCard = ({ title, value, icon, bgColor, linkTo, subtitle }) => (
    <div className="col-xl-3 col-md-6 mb-4">
      <Link to={linkTo || '#'} style={{ textDecoration: 'none' }}>
        <div 
          className="card border-0 shadow-sm h-100"
          style={{ 
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            cursor: linkTo ? 'pointer' : 'default'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div 
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  backgroundColor: bgColor || '#e8f0fe'
                }}
              >
                <i className={icon} style={{ fontSize: '22px', color: '#fff' }}></i>
              </div>
              <div className="text-right">
                <h3 className="mb-0 fw-bold" style={{ fontSize: '1.8rem', color: '#2c3e50' }}>
                  {formatNumber(value)}
                </h3>
                <small style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>
                  {subtitle || 'Total'}
                </small>
              </div>
            </div>
            <h6 style={{ color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
              {title}
            </h6>
          </div>
        </div>
      </Link>
    </div>
  );

  if (loading) {
    return (
      <SocietyLayouts>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="sr-only">Loading...</span>
            </div>
            <p className="text-muted">Memuat data dashboard...</p>
          </div>
        </div>
      </SocietyLayouts>
    );
  }

  if (error) {
    return (
      <SocietyLayouts>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '48px' }}></i>
            <h5 className="mt-3 text-danger">{error}</h5>
            <button className="btn btn-primary mt-3" onClick={fetchDashboardData}>
              <i className="fas fa-sync-alt mr-2"></i>Coba Lagi
            </button>
          </div>
        </div>
      </SocietyLayouts>
    );
  }

  const validationStatus = dashboardData?.validation_status;
  const appSummary = dashboardData?.application_summary;

  return (
    <SocietyLayouts>
      {/* Welcome Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div 
            className="card border-0 shadow-sm"
            style={{ 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)'
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="text-white mb-2 fw-bold">
                    <i className="fas fa-home mr-2"></i>
                    Dashboard Pencari Kerja
                  </h4>
                  <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>
                    Selamat datang, <strong>{dashboardData?.profile?.name || 'User'}</strong>
                  </p>
                </div>
                <div className="d-none d-md-block text-right">
                  {dashboardData?.profile?.id_card_number && (
                    <div className="text-white mb-1" style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                      <i className="fas fa-id-card mr-1"></i>{dashboardData?.profile?.id_card_number}
                    </div>
                  )}
                  {dashboardData?.profile?.regional && (
                    <div className="text-white" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      {dashboardData.profile.regional.province} - {dashboardData.profile.regional.district}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Status Card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <div 
                    className="d-flex align-items-center justify-content-center mr-3"
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      backgroundColor: validationStatus ? '#e8f0fe' : '#f8d7da'
                    }}
                  >
                    <i className="fas fa-clipboard-check" style={{ 
                      fontSize: '22px', 
                      color: validationStatus ? '#3498db' : '#dc3545' 
                    }}></i>
                  </div>
                  <div>
                    <h6 className="mb-1 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                      Status Validasi
                    </h6>
                    {validationStatus ? (
                      <div>
                        {(() => {
                          const vStatus = getValidationStatusBadge(validationStatus.status);
                          return (
                            <span className="badge" style={{ 
                              backgroundColor: vStatus.bg, 
                              color: vStatus.color,
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              border: `1px solid ${vStatus.color}`
                            }}>
                              <i className={`fas ${vStatus.icon} mr-1`}></i>{vStatus.label}
                            </span>
                          );
                        })()}
                        {validationStatus.job_category && (
                          <small className="text-muted ml-2">
                            Kategori: {validationStatus.job_category}
                          </small>
                        )}
                      </div>
                    ) : (
                      <small className="text-muted">
                        Anda belum mengajukan validasi. 
                        <Link to="/validation" className="text-primary ml-1">Ajukan sekarang</Link>
                      </small>
                    )}
                  </div>
                </div>
                <Link to="/validation" className="btn btn-outline-primary btn-sm" style={{ borderRadius: '8px' }}>
                  {validationStatus ? 'Lihat Detail' : 'Ajukan Validasi'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row">
        <StatCard 
          title="Total Lamaran"
          value={appSummary?.total_applications || 0}
          icon="fas fa-file-alt"
          bgColor="#3498db"
          linkTo="/application"
          subtitle="Lamaran Diajukan"
        />
        <StatCard 
          title="Lamaran Pending"
          value={appSummary?.pending || 0}
          icon="fas fa-clock"
          bgColor="#f39c12"
          linkTo="/application?status=pending"
          subtitle="Menunggu Diproses"
        />
        <StatCard 
          title="Lamaran Diterima"
          value={appSummary?.accepted || 0}
          icon="fas fa-check-circle"
          bgColor="#2ecc71"
          linkTo="/application?status=accepted"
          subtitle="Disetujui"
        />
        <StatCard 
          title="Lamaran Ditolak"
          value={appSummary?.rejected || 0}
          icon="fas fa-times-circle"
          bgColor="#e74c3c"
          subtitle="Dikembalikan"
        />
      </div>

      <div className="row">
        <StatCard 
          title="Lowongan Dibookmark"
          value={dashboardData?.bookmarked_jobs || 0}
          icon="fas fa-bookmark"
          bgColor="#9b59b6"
          linkTo="/bookmarks"
          subtitle="Tersimpan"
        />
        <StatCard 
          title="Notifikasi Belum Dibaca"
          value={dashboardData?.unread_notifications || 0}
          icon="fas fa-bell"
          bgColor="#e67e22"
          linkTo="/notifications"
          subtitle="Notifikasi Baru"
        />
        <StatCard 
          title="Lowongan Tersedia"
          value={'-'}
          icon="fas fa-briefcase"
          bgColor="#1abc9c"
          linkTo="/job-vacancies"
          subtitle="Lihat Semua"
        />
        <StatCard 
          title="Riwayat Lamaran"
          value={'-'}
          icon="fas fa-history"
          bgColor="#7f8c8d"
          linkTo="/history"
          subtitle="Lihat Riwayat"
        />
      </div>

      {/* Recent Applications & Recommended Jobs */}
      <div className="row mt-2">
        {/* Recent Applications */}
        <div className="col-lg-6 mb-4">
          <div 
            className="card border-0 shadow-sm h-100"
            style={{ borderRadius: '12px' }}
          >
            <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: '12px 12px 0 0' }}>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                  <i className="fas fa-file-alt text-primary mr-2"></i>
                  Lamaran Terbaru
                </h6>
                <Link 
                  to="/application" 
                  className="btn btn-sm btn-outline-primary"
                  style={{ borderRadius: '8px' }}
                >
                  Lihat Semua
                </Link>
              </div>
            </div>
            <div className="card-body pt-0">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Perusahaan</th>
                      <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Posisi</th>
                      <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData?.recent_applications?.length > 0 ? (
                      dashboardData.recent_applications.map((item, index) => (
                        <tr key={index}>
                          <td style={{ fontSize: '0.9rem' }}>
                            <i className="fas fa-building text-muted mr-2"></i>
                            {item.company || 'N/A'}
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>
                            {item.positions?.map(p => p.position).join(', ') || '-'}
                          </td>
                          <td>
                            {item.positions?.map((p, i) => {
                              const status = getStatusBadge(p.status);
                              return (
                                <span key={i} className="badge mr-1" style={{ 
                                  backgroundColor: status.bg, 
                                  color: status.color,
                                  padding: '3px 8px',
                                  borderRadius: '20px',
                                  fontSize: '0.7rem'
                                }}>
                                  {status.label}
                                </span>
                              );
                            })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center text-muted py-3">
                          <i className="fas fa-inbox mr-2"></i>
                          Belum ada lamaran
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Jobs */}
        <div className="col-lg-6 mb-4">
          <div 
            className="card border-0 shadow-sm h-100"
            style={{ borderRadius: '12px' }}
          >
            <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: '12px 12px 0 0' }}>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                  <i className="fas fa-star text-warning mr-2"></i>
                  Rekomendasi Lowongan
                </h6>
                <Link 
                  to="/job-vacancies" 
                  className="btn btn-sm btn-outline-primary"
                  style={{ borderRadius: '8px' }}
                >
                  Lihat Semua
                </Link>
              </div>
            </div>
            <div className="card-body pt-0">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Perusahaan</th>
                      <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Kategori</th>
                      <th className="text-center" style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Posisi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData?.recommended_jobs?.length > 0 ? (
                      dashboardData.recommended_jobs.map((job, index) => (
                        <tr key={index}>
                          <td style={{ fontSize: '0.9rem' }}>
                            <i className="fas fa-building text-muted mr-2"></i>
                            {job.company || 'N/A'}
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>
                            <i className="fas fa-tag text-muted mr-1"></i>
                            {job.category || '-'}
                          </td>
                          <td className="text-center">
                            <span className="badge" style={{ 
                              backgroundColor: '#e8f0fe', 
                              color: '#3498db',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.78rem'
                            }}>
                              {job.positions?.length || 0} Posisi
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center text-muted py-3">
                          <i className="fas fa-inbox mr-2"></i>
                          Belum ada rekomendasi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div 
            className="card border-0 shadow-sm"
            style={{ borderRadius: '12px' }}
          >
            <div className="card-header bg-white border-0 pt-4 pb-3">
              <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                <i className="fas fa-bolt text-warning mr-2"></i>
                Aksi Cepat
              </h6>
            </div>
            <div className="card-body pt-0">
              <div className="row">
                <div className="col-md-3 col-6 mb-3">
                  <Link 
                    to="/job-vacancies" 
                    className="btn btn-outline-primary btn-block py-3"
                    style={{ borderRadius: '10px' }}
                  >
                    <i className="fas fa-search mr-2"></i>
                    Cari Lowongan
                  </Link>
                </div>
                <div className="col-md-3 col-6 mb-3">
                  <Link 
                    to="/validation" 
                    className="btn btn-outline-success btn-block py-3"
                    style={{ borderRadius: '10px' }}
                  >
                    <i className="fas fa-clipboard-check mr-2"></i>
                    Ajukan Validasi
                  </Link>
                </div>
                <div className="col-md-3 col-6 mb-3">
                  <Link 
                    to="/profile" 
                    className="btn btn-outline-warning btn-block py-3"
                    style={{ borderRadius: '10px' }}
                  >
                    <i className="fas fa-user-edit mr-2"></i>
                    Update Profil
                  </Link>
                </div>
                <div className="col-md-3 col-6 mb-3">
                  <Link 
                    to="/application" 
                    className="btn btn-outline-info btn-block py-3"
                    style={{ borderRadius: '10px' }}
                  >
                    <i className="fas fa-file-alt mr-2"></i>
                    Lihat Lamaran
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SocietyLayouts>
  );
}