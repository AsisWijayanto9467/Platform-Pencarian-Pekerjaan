import React, { useState, useEffect } from 'react';
import MainLayouts from '../layouts/MainLayouts';
import api from '../../services/api';
import { Link } from 'react-router-dom';

export default function OfficerDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/officer/dashboard');
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
        return { icon: 'fa-check-circle', color: '#155724', bg: '#d4edda', label: 'Disetujui' };
      case 'rejected':
        return { icon: 'fa-times-circle', color: '#721c24', bg: '#f8d7da', label: 'Ditolak' };
      case 'declined':
        return { icon: 'fa-times-circle', color: '#721c24', bg: '#f8d7da', label: 'Ditolak' };
      case 'pending':
      default:
        return { icon: 'fa-clock', color: '#856404', bg: '#fff3cd', label: 'Tertunda' };
    }
  };

  const StatCard = ({ title, value, icon, bgColor, linkTo, subtitle }) => (
    <div className="col-xl-3 col-md-6 mb-4">
      {linkTo ? (
        <Link to={linkTo} style={{ textDecoration: 'none' }}>
          <StatCardContent title={title} value={value} icon={icon} bgColor={bgColor} subtitle={subtitle} />
        </Link>
      ) : (
        <StatCardContent title={title} value={value} icon={icon} bgColor={bgColor} subtitle={subtitle} />
      )}
    </div>
  );

  const StatCardContent = ({ title, value, icon, bgColor, subtitle }) => (
    <div 
      className="card border-0 shadow-sm h-100"
      style={{ 
        borderRadius: '12px',
        transition: 'all 0.3s ease'
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
              {typeof value === 'string' ? value : formatNumber(value)}
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
  );

  if (loading) {
    return (
      <MainLayouts>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="sr-only">Loading...</span>
            </div>
            <p className="text-muted">Memuat data dashboard officer...</p>
          </div>
        </div>
      </MainLayouts>
    );
  }

  if (error) {
    return (
      <MainLayouts>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '48px' }}></i>
            <h5 className="mt-3 text-danger">{error}</h5>
            <button className="btn btn-primary mt-3" onClick={fetchDashboardData}>
              <i className="fas fa-sync-alt mr-2"></i>Coba Lagi
            </button>
          </div>
        </div>
      </MainLayouts>
    );
  }

  return (
    <MainLayouts>
      <div className="container-fluid px-0">
        {/* Welcome Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div 
              className="card border-0 shadow-sm"
              style={{ 
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)'
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h4 className="text-white mb-2 fw-bold">
                      <i className="fas fa-user-tie mr-2"></i>
                      Dashboard Officer
                    </h4>
                    <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>
                      Selamat datang, <strong>{dashboardData?.profile?.name}</strong>
                    </p>
                  </div>
                  <div className="d-none d-md-block text-right">
                    <div className="text-white mb-1" style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                      {dashboardData?.profile?.employee_id && (
                        <><i className="fas fa-id-badge mr-1"></i>{dashboardData?.profile?.employee_id}</>
                      )}
                    </div>
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

        {/* Today's Summary Cards */}
        <div className="row mb-4">
          <div className="col-12">
            <h6 className="fw-bold mb-3" style={{ color: '#2c3e50', fontSize: '0.95rem' }}>
              <i className="fas fa-calendar-day text-primary mr-2"></i>Ringkasan Hari Ini
            </h6>
          </div>
          <div className="col-xl-2 col-md-4 col-6 mb-3">
            <div className="card border-0 shadow-sm text-center" style={{ borderRadius: '12px' }}>
              <div className="card-body py-3">
                <i className="fas fa-file-alt mb-2" style={{ fontSize: '20px', color: '#3498db' }}></i>
                <h5 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                  {formatNumber(dashboardData?.today_summary?.new_applications_today || 0)}
                </h5>
                <small style={{ color: '#888', fontSize: '0.7rem' }}>Lamaran Baru</small>
              </div>
            </div>
          </div>
          <div className="col-xl-2 col-md-4 col-6 mb-3">
            <div className="card border-0 shadow-sm text-center" style={{ borderRadius: '12px' }}>
              <div className="card-body py-3">
                <i className="fas fa-check-double mb-2" style={{ fontSize: '20px', color: '#2ecc71' }}></i>
                <h5 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                  {formatNumber(dashboardData?.today_summary?.processed_today || 0)}
                </h5>
                <small style={{ color: '#888', fontSize: '0.7rem' }}>Diproses</small>
              </div>
            </div>
          </div>
          <div className="col-xl-2 col-md-4 col-6 mb-3">
            <div className="card border-0 shadow-sm text-center" style={{ borderRadius: '12px' }}>
              <div className="card-body py-3">
                <i className="fas fa-clipboard-check mb-2" style={{ fontSize: '20px', color: '#9b59b6' }}></i>
                <h5 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                  {formatNumber(dashboardData?.today_summary?.validations_today || 0)}
                </h5>
                <small style={{ color: '#888', fontSize: '0.7rem' }}>Validasi</small>
              </div>
            </div>
          </div>
          <div className="col-xl-2 col-md-4 col-6 mb-3">
            <div className="card border-0 shadow-sm text-center" style={{ borderRadius: '12px' }}>
              <div className="card-body py-3">
                <i className="fas fa-briefcase mb-2" style={{ fontSize: '20px', color: '#e74c3c' }}></i>
                <h5 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                  {formatNumber(dashboardData?.today_summary?.vacancies_created_today || 0)}
                </h5>
                <small style={{ color: '#888', fontSize: '0.7rem' }}>Lowongan Baru</small>
              </div>
            </div>
          </div>
          <div className="col-xl-2 col-md-4 col-6 mb-3">
            <div className="card border-0 shadow-sm text-center" style={{ borderRadius: '12px' }}>
              <div className="card-body py-3">
                <i className="fas fa-exclamation-circle mb-2" style={{ fontSize: '20px', color: '#e74c3c' }}></i>
                <h5 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                  {formatNumber(dashboardData?.attention_needed?.old_pending_applications || 0)}
                </h5>
                <small style={{ color: '#888', fontSize: '0.7rem' }}>Perlu Perhatian</small>
              </div>
            </div>
          </div>
          <div className="col-xl-2 col-md-4 col-6 mb-3">
            <div className="card border-0 shadow-sm text-center" style={{ borderRadius: '12px' }}>
              <div className="card-body py-3">
                <i className="fas fa-bell mb-2" style={{ fontSize: '20px', color: '#f39c12' }}></i>
                <h5 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                  {formatNumber(dashboardData?.attention_needed?.urgent_notifications || 0)}
                </h5>
                <small style={{ color: '#888', fontSize: '0.7rem' }}>Notifikasi</small>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Row 1 - Application Stats */}
        <div className="row">
          <StatCard 
            title="Total Lowongan"
            value={dashboardData?.job_vacancy_stats?.total_vacancies}
            icon="fas fa-briefcase"
            bgColor="#e74c3c"
            linkTo="/officer/vacancies"
            subtitle="Lowongan Aktif"
          />
          <StatCard 
            title="Total Lamaran"
            value={dashboardData?.application_stats?.total}
            icon="fas fa-file-alt"
            bgColor="#3498db"
            linkTo="/officer/applications"
            subtitle="Lamaran Masuk"
          />
          <StatCard 
            title="Lamaran Pending"
            value={dashboardData?.application_stats?.pending}
            icon="fas fa-clock"
            bgColor="#f39c12"
            linkTo="/officer/applications?status=pending"
            subtitle="Perlu Diproses"
          />
          <StatCard 
            title="Lamaran Diterima"
            value={dashboardData?.application_stats?.accepted}
            icon="fas fa-check-circle"
            bgColor="#2ecc71"
            subtitle="Disetujui"
          />
        </div>

        {/* Main Stats Row 2 - More Stats */}
        <div className="row">
          <StatCard 
            title="Lamaran Ditolak"
            value={dashboardData?.application_stats?.rejected}
            icon="fas fa-times-circle"
            bgColor="#c0392b"
            subtitle="Dikembalikan"
          />
          <StatCard 
            title="Total Posisi"
            value={dashboardData?.job_vacancy_stats?.total_positions}
            icon="fas fa-list-ol"
            bgColor="#1abc9c"
            subtitle="Posisi Tersedia"
          />
          <StatCard 
            title="Lowongan Bulan Ini"
            value={dashboardData?.job_vacancy_stats?.vacancies_this_month}
            icon="fas fa-calendar-alt"
            bgColor="#e67e22"
            subtitle={new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          />
          <StatCard 
            title="Lamaran Bulan Ini"
            value={dashboardData?.application_stats?.this_month}
            icon="fas fa-chart-line"
            bgColor="#9b59b6"
            subtitle="Bulan Berjalan"
          />
        </div>

        {/* Validation Stats Row */}
        <div className="row">
          <StatCard 
            title="Total Validasi Ditangani"
            value={dashboardData?.validation_stats?.total_handled}
            icon="fas fa-clipboard-list"
            bgColor="#34495e"
            subtitle="Keseluruhan"
          />
          <StatCard 
            title="Validasi Tertunda"
            value={dashboardData?.validation_stats?.pending}
            icon="fas fa-hourglass-half"
            bgColor="#f39c12"
            subtitle="Milik Saya"
          />
          <StatCard 
            title="Validasi Disetujui"
            value={dashboardData?.validation_stats?.accepted}
            icon="fas fa-check-circle"
            bgColor="#27ae60"
            subtitle="Terverifikasi"
          />
          <StatCard 
            title="Belum Ditugaskan"
            value={dashboardData?.unassigned_validations}
            icon="fas fa-inbox"
            bgColor="#8e44ad"
            linkTo="/validator/validations/pending"
            subtitle="Bisa Diambil"
          />
        </div>

        {/* Detail Section */}
        <div className="row mt-2">
          {/* Recent Validations */}
          <div className="col-lg-4 mb-4">
            <div 
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: '12px' }}
            >
              <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: '12px 12px 0 0' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                    <i className="fas fa-clipboard-check text-success mr-2"></i>
                    Validasi Terbaru
                  </h6>
                  <Link 
                    to="/validator/validations/pending" 
                    className="btn btn-sm btn-outline-primary"
                    style={{ borderRadius: '8px' }}
                  >
                    Lihat Semua
                  </Link>
                </div>
              </div>
              <div className="card-body pt-0">
                <div className="table-responsive">
                  <table className="table table-hover table-sm">
                    <thead>
                      <tr>
                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Pencari Kerja</th>
                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.recent_validations?.length > 0 ? (
                        dashboardData.recent_validations.map((item, index) => {
                          const status = getStatusBadge(item.status);
                          return (
                            <tr key={index}>
                              <td style={{ fontSize: '0.85rem' }}>
                                <div>
                                  <i className="fas fa-user text-muted mr-1"></i>
                                  {item.society?.name || 'N/A'}
                                </div>
                              </td>
                              <td>
                                <span 
                                  className="badge"
                                  style={{ 
                                    backgroundColor: status.bg, 
                                    color: status.color,
                                    padding: '3px 8px',
                                    borderRadius: '20px',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  {status.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="2" className="text-center text-muted py-2">
                            <small>Belum ada validasi</small>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Vacancies */}
          <div className="col-lg-4 mb-4">
            <div 
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: '12px' }}
            >
              <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: '12px 12px 0 0' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                    <i className="fas fa-briefcase text-danger mr-2"></i>
                    Lowongan Terbaru
                  </h6>
                  <Link 
                    to="/officer/vacancies" 
                    className="btn btn-sm btn-outline-primary"
                    style={{ borderRadius: '8px' }}
                  >
                    Lihat Semua
                  </Link>
                </div>
              </div>
              <div className="card-body pt-0">
                <div className="table-responsive">
                  <table className="table table-hover table-sm">
                    <thead>
                      <tr>
                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Perusahaan</th>
                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Pelamar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.job_vacancy_stats?.recent_vacancies?.length > 0 ? (
                        dashboardData.job_vacancy_stats.recent_vacancies.map((item, index) => (
                          <tr key={index}>
                            <td style={{ fontSize: '0.85rem' }}>
                              <i className="fas fa-building text-muted mr-1"></i>
                              {item.company}
                            </td>
                            <td className="text-center">
                              <span className="badge" style={{ 
                                backgroundColor: '#e8f0fe', 
                                color: '#3498db',
                                padding: '3px 8px',
                                borderRadius: '20px',
                                fontSize: '0.75rem'
                              }}>
                                {item.job_apply_societies_count || 0}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" className="text-center text-muted py-2">
                            <small>Belum ada lowongan</small>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="col-lg-4 mb-4">
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
                    to="/officer/applications" 
                    className="btn btn-sm btn-outline-primary"
                    style={{ borderRadius: '8px' }}
                  >
                    Lihat Semua
                  </Link>
                </div>
              </div>
              <div className="card-body pt-0">
                <div className="table-responsive">
                  <table className="table table-hover table-sm">
                    <thead>
                      <tr>
                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Pelamar</th>
                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.application_stats?.recent_applications?.slice(0, 5).length > 0 ? (
                        dashboardData.application_stats.recent_applications.slice(0, 5).map((item, index) => {
                          const status = getStatusBadge(item.status);
                          return (
                            <tr key={index}>
                              <td style={{ fontSize: '0.85rem' }}>
                                <div>
                                  <i className="fas fa-user text-muted mr-1"></i>
                                  {item.society?.name || 'N/A'}
                                </div>
                              </td>
                              <td>
                                <span 
                                  className="badge"
                                  style={{ 
                                    backgroundColor: status.bg, 
                                    color: status.color,
                                    padding: '3px 8px',
                                    borderRadius: '20px',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  {status.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="2" className="text-center text-muted py-2">
                            <small>Belum ada lamaran</small>
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

        {/* Top Vacancies & Monthly Trends */}
        <div className="row mt-2">
          {/* Top Vacancies */}
          <div className="col-lg-6 mb-4">
            <div 
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: '12px' }}
            >
              <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: '12px 12px 0 0' }}>
                <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                  <i className="fas fa-fire text-danger mr-2"></i>
                  Lowongan Terpopuler
                </h6>
              </div>
              <div className="card-body pt-0">
                <div className="table-responsive">
                  <table className="table table-hover table-sm">
                    <thead>
                      <tr>
                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>#</th>
                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Perusahaan</th>
                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Kategori</th>
                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Pelamar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.top_vacancies?.length > 0 ? (
                        dashboardData.top_vacancies.map((item, index) => (
                          <tr key={item.id}>
                            <td style={{ fontSize: '0.85rem', fontWeight: '600' }}>{index + 1}</td>
                            <td style={{ fontSize: '0.85rem' }}>{item.company}</td>
                            <td style={{ fontSize: '0.8rem' }}>{item.category}</td>
                            <td className="text-center">
                              <span className="badge" style={{ 
                                backgroundColor: '#e8f0fe', 
                                color: '#3498db',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '0.78rem'
                              }}>
                                {item.total_applicants}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center text-muted py-2">
                            <small>Belum ada data</small>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="col-lg-6 mb-4">
            <div 
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: '12px' }}
            >
              <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: '12px 12px 0 0' }}>
                <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                  <i className="fas fa-chart-line text-primary mr-2"></i>
                  Tren Bulanan (6 Bulan)
                </h6>
              </div>
              <div className="card-body pt-0">
                <div className="table-responsive">
                  <table className="table table-hover table-sm">
                    <thead>
                      <tr>
                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Bulan</th>
                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Lamaran</th>
                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Lowongan</th>
                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Validasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.monthly_trends?.length > 0 ? (
                        dashboardData.monthly_trends.map((item, index) => (
                          <tr key={index}>
                            <td style={{ fontSize: '0.85rem', fontWeight: '600' }}>{item.month}</td>
                            <td className="text-center">
                              <span className="badge" style={{ 
                                backgroundColor: '#e8f0fe', 
                                color: '#3498db',
                                padding: '3px 8px',
                                borderRadius: '20px',
                                fontSize: '0.75rem'
                              }}>
                                {item.applications}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="badge" style={{ 
                                backgroundColor: '#fde8e8', 
                                color: '#e74c3c',
                                padding: '3px 8px',
                                borderRadius: '20px',
                                fontSize: '0.75rem'
                              }}>
                                {item.vacancies}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="badge" style={{ 
                                backgroundColor: '#e8f8f0', 
                                color: '#2ecc71',
                                padding: '3px 8px',
                                borderRadius: '20px',
                                fontSize: '0.75rem'
                              }}>
                                {item.validations}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center text-muted py-2">
                            <small>Belum ada data</small>
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
                      to="/officer/vacancies" 
                      className="btn btn-outline-danger btn-block py-3"
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="fas fa-briefcase mr-2"></i>
                      Kelola Lowongan
                    </Link>
                  </div>
                  <div className="col-md-3 col-6 mb-3">
                    <Link 
                      to="/officer/applications" 
                      className="btn btn-outline-primary btn-block py-3"
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="fas fa-file-alt mr-2"></i>
                      Kelola Lamaran
                    </Link>
                  </div>
                  <div className="col-md-3 col-6 mb-3">
                    <Link 
                      to="/validator/validations/pending" 
                      className="btn btn-outline-warning btn-block py-3"
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="fas fa-clipboard-check mr-2"></i>
                      Validasi Pending
                    </Link>
                  </div>
                  <div className="col-md-3 col-6 mb-3">
                    <Link 
                      to="/validator/profile" 
                      className="btn btn-outline-info btn-block py-3"
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="fas fa-user-edit mr-2"></i>
                      Update Profil
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayouts>
  );
}