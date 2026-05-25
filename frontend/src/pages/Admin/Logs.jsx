import React, { useState, useEffect } from 'react';
import MainLayouts from '../layouts/MainLayouts';
import api from '../../services/api';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filterType, setFilterType] = useState('');
  const [filterRead, setFilterRead] = useState('');
  const [searchUser, setSearchUser] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [totalLogs, setTotalLogs] = useState(0);

  // Detail modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filterType, filterRead, perPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      const params = { page: currentPage, per_page: perPage };
      if (filterType) params.type = filterType;
      if (filterRead !== '') params.is_read = filterRead;
      if (searchUser) params.user_id = searchUser;

      const response = await api.get('/admin/logs', { params });
      
      setLogs(response.data.data.data);
      setCurrentPage(response.data.data.current_page);
      setTotalPages(response.data.data.last_page);
      setTotalLogs(response.data.data.total);
      setError(null);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Gagal memuat data log sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setFilterType('');
    setFilterRead('');
    setSearchUser('');
    setCurrentPage(1);
  };

  // Get log type badge
  const getLogTypeBadge = (type) => {
    const types = {
      'validation': { color: '#3498db', icon: 'fa-clipboard-check', label: 'Validasi' },
      'application': { color: '#2ecc71', icon: 'fa-file-alt', label: 'Lamaran' },
      'system': { color: '#9b59b6', icon: 'fa-cog', label: 'Sistem' },
      'job_vacancy': { color: '#e67e22', icon: 'fa-briefcase', label: 'Lowongan' },
      'user': { color: '#1abc9c', icon: 'fa-user', label: 'Pengguna' },
      'warning': { color: '#f39c12', icon: 'fa-exclamation-triangle', label: 'Peringatan' },
      'error': { color: '#e74c3c', icon: 'fa-times-circle', label: 'Error' },
      'info': { color: '#95a5a6', icon: 'fa-info-circle', label: 'Info' }
    };
    
    return types[type] || { color: '#95a5a6', icon: 'fa-info-circle', label: type || 'Umum' };
  };

  // Get role badge for user
  const getRoleBadge = (role) => {
    const roles = {
      'admin': { color: '#e74c3c', label: 'Admin' },
      'officer': { color: '#3498db', label: 'Officer' },
      'validator': { color: '#2ecc71', label: 'Validator' },
      'society': { color: '#1abc9c', label: 'Society' }
    };
    return roles[role] || { color: '#95a5a6', label: role || 'Unknown' };
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate pagination numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (loading && logs.length === 0) {
    return (
      <MainLayouts>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="sr-only">Loading...</span>
            </div>
            <p className="text-muted">Memuat log sistem...</p>
          </div>
        </div>
      </MainLayouts>
    );
  }

  return (
    <MainLayouts>
      <div className="container-fluid px-0">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div 
              className="card border-0 shadow-sm"
              style={{ 
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)'
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h4 className="text-white mb-2 fw-bold">
                      <i className="fas fa-history mr-2"></i>
                      Log Sistem
                    </h4>
                    <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>
                      Pantau semua aktivitas dan notifikasi dalam sistem
                    </p>
                  </div>
                  <div className="d-none d-md-flex align-items-center">
                    <div 
                      className="d-flex align-items-center justify-content-center mr-3"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255,255,255,0.15)'
                      }}
                    >
                      <i className="fas fa-bell text-white" style={{ fontSize: '20px' }}></i>
                    </div>
                    <div className="text-white">
                      <h5 className="mb-0 fw-bold">{totalLogs.toLocaleString('id-ID')}</h5>
                      <small style={{ opacity: 0.7 }}>Total Log</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div 
              className="card border-0 shadow-sm"
              style={{ borderRadius: '12px' }}
            >
              <div className="card-body p-4">
                <form onSubmit={handleSearch}>
                  <div className="row align-items-end">
                    <div className="col-md-3 mb-3 mb-md-0">
                      <label className="fw-bold mb-2" style={{ fontSize: '0.85rem', color: '#555' }}>
                        <i className="fas fa-tag mr-1"></i>
                        Tipe Log
                      </label>
                      <select 
                        className="form-control"
                        value={filterType}
                        onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                        style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                      >
                        <option value="">Semua Tipe</option>
                        <option value="validation">Validasi</option>
                        <option value="application">Lamaran</option>
                        <option value="system">Sistem</option>
                        <option value="job_vacancy">Lowongan</option>
                        <option value="user">Pengguna</option>
                        <option value="warning">Peringatan</option>
                        <option value="error">Error</option>
                        <option value="info">Info</option>
                      </select>
                    </div>

                    <div className="col-md-2 mb-3 mb-md-0">
                      <label className="fw-bold mb-2" style={{ fontSize: '0.85rem', color: '#555' }}>
                        <i className="fas fa-check-circle mr-1"></i>
                        Status Baca
                      </label>
                      <select 
                        className="form-control"
                        value={filterRead}
                        onChange={(e) => { setFilterRead(e.target.value); setCurrentPage(1); }}
                        style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                      >
                        <option value="">Semua</option>
                        <option value="0">Belum Dibaca</option>
                        <option value="1">Sudah Dibaca</option>
                      </select>
                    </div>

                    <div className="col-md-3 mb-3 mb-md-0">
                      <label className="fw-bold mb-2" style={{ fontSize: '0.85rem', color: '#555' }}>
                        <i className="fas fa-search mr-1"></i>
                        ID Pengguna
                      </label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="Cari berdasarkan User ID..."
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                        style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                      />
                    </div>

                    <div className="col-md-4">
                      <div className="d-flex gap-2">
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          style={{ borderRadius: '8px', padding: '8px 20px' }}
                        >
                          <i className="fas fa-filter mr-2"></i>
                          Terapkan Filter
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary"
                          onClick={handleReset}
                          style={{ borderRadius: '8px', padding: '8px 20px' }}
                        >
                          <i className="fas fa-sync-alt mr-2"></i>
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="alert alert-danger border-0" style={{ borderRadius: '12px' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    {error}
                  </div>
                  <button className="btn btn-sm btn-outline-danger" onClick={fetchLogs}>
                    <i className="fas fa-sync-alt mr-1"></i>Coba Lagi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logs Table */}
        <div className="row">
          <div className="col-12">
            <div 
              className="card border-0 shadow-sm"
              style={{ borderRadius: '12px' }}
            >
              <div className="card-header bg-white border-0 pt-4 pb-3 d-flex justify-content-between align-items-center" 
                   style={{ borderRadius: '12px 12px 0 0' }}>
                <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                  <i className="fas fa-list text-primary mr-2"></i>
                  Daftar Log Sistem
                  <span className="badge bg-primary ml-2" style={{ fontSize: '0.75rem', borderRadius: '20px' }}>
                    {totalLogs}
                  </span>
                </h6>
                <div className="d-flex align-items-center gap-3">
                  <select 
                    className="form-control form-control-sm"
                    value={perPage}
                    onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    style={{ borderRadius: '8px', width: 'auto', fontSize: '0.85rem' }}
                  >
                    <option value={25}>25 / halaman</option>
                    <option value={50}>50 / halaman</option>
                    <option value={100}>100 / halaman</option>
                  </select>
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={fetchLogs}
                    style={{ borderRadius: '8px' }}
                    title="Refresh"
                  >
                    <i className="fas fa-sync-alt"></i>
                  </button>
                </div>
              </div>
              
              <div className="card-body pt-0">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e9ecef' }}>
                        <th style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', borderTop: 'none', width: '60px' }}>
                          ID
                        </th>
                        <th style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', borderTop: 'none', width: '150px' }}>
                          Pengguna
                        </th>
                        <th style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', borderTop: 'none', width: '120px' }}>
                          Tipe
                        </th>
                        <th style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', borderTop: 'none' }}>
                          Judul
                        </th>
                        <th style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', borderTop: 'none', width: '100px' }}>
                          Status
                        </th>
                        <th style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', borderTop: 'none', width: '150px' }}>
                          Tanggal
                        </th>
                        <th style={{ fontSize: '0.8rem', color: '#888', fontWeight: '600', borderTop: 'none', width: '80px' }}>
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length > 0 ? (
                        logs.map((log) => {
                          const typeBadge = getLogTypeBadge(log.type);
                          const roleBadge = log.user ? getRoleBadge(log.user.role) : null;
                          
                          return (
                            <tr key={log.id}>
                              <td style={{ fontSize: '0.85rem' }}>
                                <span className="text-muted">#{log.id}</span>
                              </td>
                              <td>
                                {log.user ? (
                                  <div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                                      {log.user.email}
                                    </span>
                                    {roleBadge && (
                                      <span 
                                        className="badge ml-2"
                                        style={{ 
                                          backgroundColor: roleBadge.color,
                                          color: '#fff',
                                          fontSize: '0.7rem',
                                          padding: '3px 8px',
                                          borderRadius: '12px'
                                        }}
                                      >
                                        {roleBadge.label}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                    <i className="fas fa-robot mr-1"></i>
                                    System
                                  </span>
                                )}
                              </td>
                              <td>
                                <span 
                                  className="badge"
                                  style={{ 
                                    backgroundColor: typeBadge.color + '20',
                                    color: typeBadge.color,
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.78rem',
                                    fontWeight: '500'
                                  }}
                                >
                                  <i className={`fas ${typeBadge.icon} mr-1`}></i>
                                  {typeBadge.label}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.85rem', color: '#333' }}>
                                  {log.title || 'Tanpa Judul'}
                                </span>
                              </td>
                              <td>
                                <span 
                                  className="badge"
                                  style={{ 
                                    backgroundColor: log.is_read ? '#d4edda' : '#fff3cd',
                                    color: log.is_read ? '#155724' : '#856404',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.78rem',
                                    fontWeight: '500'
                                  }}
                                >
                                  <i className={`fas fa-${log.is_read ? 'check-circle' : 'clock'} mr-1`}></i>
                                  {log.is_read ? 'Dibaca' : 'Belum'}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.82rem', color: '#888' }}>
                                  {log.created_at ? new Date(log.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 'N/A'}
                                </span>
                              </td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => { setSelectedLog(log); setShowDetailModal(true); }}
                                  style={{ borderRadius: '8px', padding: '4px 10px' }}
                                  title="Lihat Detail"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-5">
                            <div className="text-muted">
                              <i className="fas fa-inbox" style={{ fontSize: '48px' }}></i>
                              <p className="mt-3" style={{ fontSize: '1rem' }}>
                                Tidak ada log ditemukan
                              </p>
                              {(filterType || filterRead !== '' || searchUser) && (
                                <button 
                                  className="btn btn-sm btn-outline-primary mt-2"
                                  onClick={handleReset}
                                  style={{ borderRadius: '8px' }}
                                >
                                  <i className="fas fa-sync-alt mr-1"></i>
                                  Reset Filter
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="card-footer bg-white border-0 pb-4" style={{ borderRadius: '0 0 12px 12px' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Menampilkan halaman {currentPage} dari {totalPages} ({totalLogs} total log)
                    </small>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage - 1)}
                            style={{ borderRadius: '8px 0 0 8px' }}
                          >
                            <i className="fas fa-chevron-left"></i>
                          </button>
                        </li>
                        
                        {getPageNumbers().map((page, index) => (
                          <li 
                            key={index} 
                            className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => page !== '...' && handlePageChange(page)}
                              style={page === currentPage ? { 
                                backgroundColor: '#0d6efd', 
                                borderColor: '#0d6efd',
                                color: '#fff'
                              } : {}}
                            >
                              {page}
                            </button>
                          </li>
                        ))}
                        
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage + 1)}
                            style={{ borderRadius: '0 8px 8px 0' }}
                          >
                            <i className="fas fa-chevron-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '550px',
              maxWidth: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header border-0 pb-0 pt-4 px-4">
              <h6 className="modal-title fw-bold">
                <i className="fas fa-info-circle text-primary mr-2"></i>
                Detail Log #{selectedLog.id}
              </h6>
              <button 
                className="btn btn-sm btn-light"
                onClick={() => setShowDetailModal(false)}
                style={{ borderRadius: '8px' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body px-4 py-3">
              <div className="row mb-3">
                <div className="col-4">
                  <small style={{ color: '#888' }}>Tipe</small>
                </div>
                <div className="col-8">
                  <span 
                    className="badge"
                    style={{ 
                      backgroundColor: getLogTypeBadge(selectedLog.type).color + '20',
                      color: getLogTypeBadge(selectedLog.type).color,
                      padding: '6px 12px',
                      borderRadius: '20px'
                    }}
                  >
                    <i className={`fas ${getLogTypeBadge(selectedLog.type).icon} mr-1`}></i>
                    {getLogTypeBadge(selectedLog.type).label}
                  </span>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-4">
                  <small style={{ color: '#888' }}>Judul</small>
                </div>
                <div className="col-8">
                  <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                    {selectedLog.title || '-'}
                  </span>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-4">
                  <small style={{ color: '#888' }}>Pesan</small>
                </div>
                <div className="col-8">
                  <p style={{ fontSize: '0.9rem', color: '#333', lineHeight: '1.6' }}>
                    {selectedLog.message || 'Tidak ada pesan'}
                  </p>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-4">
                  <small style={{ color: '#888' }}>Pengguna</small>
                </div>
                <div className="col-8">
                  {selectedLog.user ? (
                    <span style={{ fontSize: '0.9rem' }}>
                      {selectedLog.user.email}
                    </span>
                  ) : (
                    <span className="text-muted">System</span>
                  )}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-4">
                  <small style={{ color: '#888' }}>Status</small>
                </div>
                <div className="col-8">
                  <span 
                    className="badge"
                    style={{ 
                      backgroundColor: selectedLog.is_read ? '#d4edda' : '#fff3cd',
                      color: selectedLog.is_read ? '#155724' : '#856404',
                      padding: '6px 12px',
                      borderRadius: '20px'
                    }}
                  >
                    {selectedLog.is_read ? '✅ Sudah Dibaca' : '⏳ Belum Dibaca'}
                  </span>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-4">
                  <small style={{ color: '#888' }}>Tanggal</small>
                </div>
                <div className="col-8">
                  <span style={{ fontSize: '0.9rem' }}>
                    {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    }) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0 pb-4 px-4">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDetailModal(false)}
                style={{ borderRadius: '8px' }}
              >
                <i className="fas fa-times mr-2"></i>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayouts>
  );
}