import React, { useState, useEffect } from 'react';
import MainLayouts from '../layouts/MainLayouts';
import api from '../../services/api';
import { Link } from 'react-router-dom';

export default function ValidatorDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchStatsData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/validator/dashboard');
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsData = async () => {
    try {
      const response = await api.get('/validator/stats');
      setStatsData(response.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const formatNumber = (num) => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") || "0";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return { icon: 'fa-check-circle', color: '#155724', bg: '#d4edda', label: 'Disetujui' };
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
  );

  if (loading) {
    return (
      <MainLayouts>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="sr-only">Loading...</span>
            </div>
            <p className="text-muted">Memuat data dashboard...</p>
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

  const isOfficer = dashboardData?.profile?.role === 'officer';

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
                background: isOfficer 
                  ? 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' 
                  : 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)'
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h4 className="text-white mb-2 fw-bold">
                      <i className={`fas fa-${isOfficer ? 'user-tie' : 'user-check'} mr-2`}></i>
                      Dashboard {isOfficer ? 'Officer' : 'Validator'}
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

        {/* Statistics Cards Row 1 - Validation Stats */}
        <div className="row">
          <StatCard 
            title="Total Validasi Ditangani"
            value={dashboardData?.validation_stats?.total_handled}
            icon="fas fa-clipboard-list"
            bgColor="#3498db"
            subtitle="Keseluruhan"
          />
          <StatCard 
            title="Validasi Tertunda"
            value={dashboardData?.validation_stats?.pending}
            icon="fas fa-clock"
            bgColor="#f39c12"
            subtitle="Milik Saya"
          />
          <StatCard 
            title="Validasi Disetujui"
            value={dashboardData?.validation_stats?.accepted}
            icon="fas fa-check-circle"
            bgColor="#2ecc71"
            subtitle="Terverifikasi"
          />
          <StatCard 
            title="Validasi Ditolak"
            value={dashboardData?.validation_stats?.declined}
            icon="fas fa-times-circle"
            bgColor="#e74c3c"
            subtitle="Dikembalikan"
          />
        </div>

        {/* Statistics Cards Row 2 - Additional Stats */}
        <div className="row">
          <StatCard 
            title="Total Tertunda (Semua)"
            value={dashboardData?.validation_stats?.total_pending_all}
            icon="fas fa-hourglass-half"
            bgColor="#c0392b"
            subtitle="Perlu Diproses"
          />
          <StatCard 
            title="Belum Ditugaskan"
            value={dashboardData?.unassigned_validations}
            icon="fas fa-inbox"
            bgColor="#9b59b6"
            subtitle="Bisa Diambil"
          />
          <StatCard 
            title="Validasi Hari Ini"
            value={statsData?.validations_today}
            icon="fas fa-calendar-check"
            bgColor="#1abc9c"
            subtitle={statsData?.period?.today || 'Hari ini'}
          />
          <StatCard 
            title="Tingkat Penerimaan"
            value={`${statsData?.acceptance_rate || 0}`}
            icon="fas fa-percentage"
            bgColor="#e67e22"
            subtitle="Acceptance Rate"
          />
        </div>

        {/* Officer Specific Stats */}
        {isOfficer && dashboardData?.job_vacancy_stats && (
          <div className="row">
            <StatCard 
              title="Total Lowongan"
              value={dashboardData.job_vacancy_stats.total_vacancies}
              icon="fas fa-briefcase"
              bgColor="#e74c3c"
              linkTo="/officer/job-vacancies"
              subtitle="Lowongan Aktif"
            />
            <StatCard 
              title="Lowongan Saya"
              value={dashboardData.job_vacancy_stats.my_vacancies}
              icon="fas fa-building"
              bgColor="#3498db"
              subtitle="Dikelola"
            />
            <StatCard 
              title="Total Lamaran"
              value={dashboardData.job_vacancy_stats.total_applications}
              icon="fas fa-file-alt"
              bgColor="#f39c12"
              subtitle="Lamaran Masuk"
            />
            <StatCard 
              title="Lamaran Tertunda"
              value={dashboardData.job_vacancy_stats.pending_applications}
              icon="fas fa-clock"
              bgColor="#c0392b"
              subtitle="Perlu Diproses"
            />
          </div>
        )}

        {/* Detail Section */}
        <div className="row mt-2">
          {/* Recent Validations */}
          <div className={`${isOfficer ? 'col-lg-6' : 'col-lg-12'} mb-4`}>
            <div 
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: '12px' }}
            >
              <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: '12px 12px 0 0' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                    <i className="fas fa-clipboard-check text-success mr-2"></i>
                    Validasi Terbaru Saya
                  </h6>
                  <Link 
                    to={isOfficer ? "/officer/validations" : "/validator/validations"} 
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
                        <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Pencari Kerja</th>
                        <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Kategori</th>
                        <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.recent_validations?.length > 0 ? (
                        dashboardData.recent_validations.map((item, index) => {
                          const status = getStatusBadge(item.status);
                          return (
                            <tr key={index}>
                              <td style={{ fontSize: '0.9rem' }}>
                                <div>
                                  <i className="fas fa-user text-muted mr-2"></i>
                                  {item.society?.name || 'N/A'}
                                </div>
                                <small style={{ color: '#888', fontSize: '0.75rem' }}>
                                  {item.society?.id_card_number || ''}
                                </small>
                              </td>
                              <td style={{ fontSize: '0.85rem' }}>
                                <i className="fas fa-tag text-muted mr-1"></i>
                                {item.job_category?.job_category || 'N/A'}
                              </td>
                              <td>
                                <span 
                                  className="badge"
                                  style={{ 
                                    backgroundColor: status.bg, 
                                    color: status.color,
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.78rem',
                                    border: `1px solid ${status.color}`
                                  }}
                                >
                                  <i className={`fas ${status.icon} mr-1`}></i>
                                  {status.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center text-muted py-3">
                            <i className="fas fa-inbox mr-2"></i>
                            Belum ada validasi
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Applications (Officer Only) */}
          {isOfficer && dashboardData?.recent_applications && (
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
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Pelamar</th>
                          <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Perusahaan</th>
                          <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Tanggal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.recent_applications.length > 0 ? (
                          dashboardData.recent_applications.map((item, index) => (
                            <tr key={index}>
                              <td style={{ fontSize: '0.9rem' }}>
                                <i className="fas fa-user text-muted mr-2"></i>
                                {item.society?.name || 'N/A'}
                              </td>
                              <td style={{ fontSize: '0.9rem' }}>
                                <i className="fas fa-building text-muted mr-2"></i>
                                {item.job_vacancy?.company || 'N/A'}
                              </td>
                              <td style={{ fontSize: '0.85rem', color: '#888' }}>
                                {item.date ? new Date(item.date).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                }) : 'N/A'}
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
          )}
        </div>

        {/* Daily Stats & Performance */}
        {statsData && (
          <div className="row mt-2">
            {/* Daily Stats */}
            <div className="col-lg-6 mb-4">
              <div 
                className="card border-0 shadow-sm h-100"
                style={{ borderRadius: '12px' }}
              >
                <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: '12px 12px 0 0' }}>
                  <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                    <i className="fas fa-chart-line text-primary mr-2"></i>
                    Statistik Harian (14 Hari)
                  </h6>
                </div>
                <div className="card-body pt-0">
                  <div className="table-responsive">
                    <table className="table table-hover table-sm">
                      <thead>
                        <tr>
                          <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Tanggal</th>
                          <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Total</th>
                          <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Disetujui</th>
                          <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Ditolak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsData.daily_stats?.length > 0 ? (
                          statsData.daily_stats.map((day, index) => (
                            <tr key={index}>
                              <td style={{ fontSize: '0.85rem' }}>
                                {new Date(day.date).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </td>
                              <td className="text-center" style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                                {day.total}
                              </td>
                              <td className="text-center">
                                <span className="badge" style={{ 
                                  backgroundColor: '#d4edda', 
                                  color: '#155724', 
                                  padding: '3px 8px', 
                                  borderRadius: '20px',
                                  fontSize: '0.75rem'
                                }}>
                                  {day.accepted}
                                </span>
                              </td>
                              <td className="text-center">
                                <span className="badge" style={{ 
                                  backgroundColor: '#f8d7da', 
                                  color: '#721c24', 
                                  padding: '3px 8px', 
                                  borderRadius: '20px',
                                  fontSize: '0.75rem'
                                }}>
                                  {day.declined}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center text-muted py-3">
                              <i className="fas fa-inbox mr-2"></i>
                              Belum ada data harian
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* By Category & Performance */}
            <div className="col-lg-6 mb-4">
              {/* By Category */}
              <div 
                className="card border-0 shadow-sm mb-4"
                style={{ borderRadius: '12px' }}
              >
                <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: '12px 12px 0 0' }}>
                  <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                    <i className="fas fa-tags text-warning mr-2"></i>
                    Validasi per Kategori
                  </h6>
                </div>
                <div className="card-body pt-0">
                  <div className="table-responsive">
                    <table className="table table-hover table-sm">
                      <thead>
                        <tr>
                          <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Kategori</th>
                          <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsData.by_category?.length > 0 ? (
                          statsData.by_category.map((cat, index) => (
                            <tr key={index}>
                              <td style={{ fontSize: '0.85rem' }}>
                                {cat.job_category?.job_category || 'N/A'}
                              </td>
                              <td className="text-center">
                                <span className="badge" style={{ 
                                  backgroundColor: '#e8f0fe', 
                                  color: '#3498db', 
                                  padding: '4px 10px', 
                                  borderRadius: '20px',
                                  fontSize: '0.8rem'
                                }}>
                                  {cat.total}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="2" className="text-center text-muted py-3">
                              <i className="fas fa-inbox mr-2"></i>
                              Belum ada data
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Performance Info */}
              <div 
                className="card border-0 shadow-sm"
                style={{ borderRadius: '12px' }}
              >
                <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: '12px 12px 0 0' }}>
                  <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                    <i className="fas fa-tachometer-alt text-success mr-2"></i>
                    Performa Saya
                  </h6>
                </div>
                <div className="card-body pt-0">
                  <div className="row text-center">
                    <div className="col-4">
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2ecc71' }}>
                        {statsData.validations_this_month || 0}
                      </div>
                      <small style={{ color: '#888', fontSize: '0.8rem' }}>Bulan Ini</small>
                    </div>
                    <div className="col-4">
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3498db' }}>
                        {statsData.acceptance_rate || 0}%
                      </div>
                      <small style={{ color: '#888', fontSize: '0.8rem' }}>Tingkat Penerimaan</small>
                    </div>
                    <div className="col-4">
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e67e22' }}>
                        {statsData.average_response_time || '-'}
                      </div>
                      <small style={{ color: '#888', fontSize: '0.8rem' }}>Rata-rata Respon</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                      to={isOfficer ? "/officer/validations" : "/validator/validations"} 
                      className="btn btn-outline-primary btn-block py-3"
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="fas fa-clipboard-check mr-2"></i>
                      Kelola Validasi
                    </Link>
                  </div>
                  {isOfficer && (
                    <div className="col-md-3 col-6 mb-3">
                      <Link 
                        to="/officer/job-vacancies" 
                        className="btn btn-outline-success btn-block py-3"
                        style={{ borderRadius: '10px' }}
                      >
                        <i className="fas fa-briefcase mr-2"></i>
                        Kelola Lowongan
                      </Link>
                    </div>
                  )}
                  <div className="col-md-3 col-6 mb-3">
                    <Link 
                      to={isOfficer ? "/officer/validations/unassigned" : "/validator/validations/unassigned"} 
                      className="btn btn-outline-warning btn-block py-3"
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="fas fa-inbox mr-2"></i>
                      Ambil Validasi Baru
                    </Link>
                  </div>
                  <div className="col-md-3 col-6 mb-3">
                    <Link 
                      to="/profile" 
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