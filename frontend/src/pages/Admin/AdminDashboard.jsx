import React, { useState, useEffect } from 'react';
import MainLayouts from '../layouts/MainLayouts';
import api from '../../services/api';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard');
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Format angka dengan pemisah ribuan
  const formatNumber = (num) => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") || "0";
  };

  // Stat Card Component
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

  // Table Row Component
  const TableRow = ({ children, style }) => (
    <tr style={style}>{children}</tr>
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h4 className="text-white mb-2 fw-bold">
                      <i className="fas fa-crown mr-2"></i>
                      Dashboard Administrator
                    </h4>
                    <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>
                      Ringkasan sistem JobPortal secara keseluruhan
                    </p>
                  </div>
                  <div className="d-none d-md-block">
                    <i className="fas fa-chart-pie text-white" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards Row 1 */}
        <div className="row">
          <StatCard 
            title="Total Pencari Kerja"
            value={dashboardData?.total_societies}
            icon="fas fa-users"
            bgColor="#3498db"
            linkTo="/admin/societies"
            subtitle="Society"
          />
          <StatCard 
            title="Total Validator"
            value={dashboardData?.total_validators}
            icon="fas fa-user-check"
            bgColor="#2ecc71"
            linkTo="/admin/validators"
            subtitle="Validator"
          />
          <StatCard 
            title="Total Officer"
            value={dashboardData?.total_officers}
            icon="fas fa-user-tie"
            bgColor="#e67e22"
            linkTo="/admin/officers"
            subtitle="Officer"
          />
          <StatCard 
            title="Kategori Pekerjaan"
            value={dashboardData?.total_job_categories}
            icon="fas fa-tags"
            bgColor="#9b59b6"
            linkTo="/admin/job-categories"
            subtitle="Kategori Aktif"
          />
        </div>

        {/* Statistics Cards Row 2 */}
        <div className="row">
          <StatCard 
            title="Total Regional"
            value={dashboardData?.total_regionals}
            icon="fas fa-map-marker-alt"
            bgColor="#1abc9c"
            linkTo="/admin/regionals"
            subtitle="Wilayah"
          />
          <StatCard 
            title="Lowongan Kerja"
            value={dashboardData?.total_job_vacancies}
            icon="fas fa-briefcase"
            bgColor="#e74c3c"
            linkTo="/admin/job-vacancies"
            subtitle="Total"
          />
          <StatCard 
            title="Total Lamaran"
            value={dashboardData?.total_applications}
            icon="fas fa-file-alt"
            bgColor="#f39c12"
            linkTo="/admin/validations"
            subtitle="Aplikasi"
          />
          <StatCard 
            title="Validasi Tertunda"
            value={dashboardData?.pending_validations}
            icon="fas fa-clock"
            bgColor="#c0392b"
            linkTo="/admin/validations"
            subtitle="Perlu Diproses"
          />
        </div>

        {/* Recent Data Section */}
        <div className="row mt-2">
          {/* Recent Validations */}
          <div className="col-lg-6 mb-4">
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
                    to="/admin/validations" 
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
                        <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Masyarakat</th>
                        <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Validator</th>
                        <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.recent_validations?.length > 0 ? (
                        dashboardData.recent_validations.map((item, index) => (
                          <TableRow key={index}>
                            <td style={{ fontSize: '0.9rem' }}>
                              <i className="fas fa-user text-muted mr-2"></i>
                              {item.society?.name || 'N/A'}
                            </td>
                            <td style={{ fontSize: '0.9rem' }}>
                              {item.validator?.name || (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <span 
                                className="badge"
                                style={{ 
                                  backgroundColor: item.status === 'pending' ? '#ffeaa7' : 
                                                  item.status === 'approved' ? '#55efc4' : '#fab1a0',
                                  color: item.status === 'pending' ? '#d68910' : 
                                         item.status === 'approved' ? '#006266' : '#d63031',
                                  padding: '6px 12px',
                                  borderRadius: '20px',
                                  fontSize: '0.8rem'
                                }}
                              >
                                {item.status === 'pending' ? '⏳ Tertunda' : 
                                 item.status === 'approved' ? '✅ Disetujui' : '❌ Ditolak'}
                              </span>
                            </td>
                          </TableRow>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center text-muted py-3">
                            <i className="fas fa-inbox mr-2"></i>
                            Belum ada data validasi
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
                    to="/admin/validations" 
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
                      {dashboardData?.recent_applications?.length > 0 ? (
                        dashboardData.recent_applications.map((item, index) => (
                          <TableRow key={index}>
                            <td style={{ fontSize: '0.9rem' }}>
                              <i className="fas fa-user text-muted mr-2"></i>
                              {item.society?.name || 'N/A'}
                            </td>
                            <td style={{ fontSize: '0.9rem' }}>
                              <i className="fas fa-building text-muted mr-2"></i>
                              {item.job_vacancy?.company || 'N/A'}
                            </td>
                            <td style={{ fontSize: '0.85rem', color: '#888' }}>
                              {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }) : 'N/A'}
                            </td>
                          </TableRow>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center text-muted py-3">
                            <i className="fas fa-inbox mr-2"></i>
                            Belum ada data lamaran
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
                      to="/admin/regionals" 
                      className="btn btn-outline-primary btn-block py-3"
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="fas fa-plus-circle mr-2"></i>
                      Tambah Regional
                    </Link>
                  </div>
                  <div className="col-md-3 col-6 mb-3">
                    <Link 
                      to="/admin/validators" 
                      className="btn btn-outline-success btn-block py-3"
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="fas fa-plus-circle mr-2"></i>
                      Tambah Validator
                    </Link>
                  </div>
                  <div className="col-md-3 col-6 mb-3">
                    <Link 
                      to="/admin/officers" 
                      className="btn btn-outline-warning btn-block py-3"
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="fas fa-plus-circle mr-2"></i>
                      Tambah Officer
                    </Link>
                  </div>
                  <div className="col-md-3 col-6 mb-3">
                    <Link 
                      to="/admin/reports" 
                      className="btn btn-outline-info btn-block py-3"
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="fas fa-download mr-2"></i>
                      Export Laporan
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