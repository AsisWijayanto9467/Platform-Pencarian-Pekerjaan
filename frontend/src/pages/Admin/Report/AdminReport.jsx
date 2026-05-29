import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function AdminReport() {
    // Data states
    const [statistics, setStatistics] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [exportData, setExportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Tab state
    const [activeTab, setActiveTab] = useState('statistics');
    
    // Report form states
    const [reportType, setReportType] = useState('monthly');
    const [reportDateFrom, setReportDateFrom] = useState('');
    const [reportDateTo, setReportDateTo] = useState('');
    const [reportFormat, setReportFormat] = useState('json');
    const [generatingReport, setGeneratingReport] = useState(false);
    
    // Export form states
    const [exportType, setExportType] = useState('societies');
    const [exportDateFrom, setExportDateFrom] = useState('');
    const [exportDateTo, setExportDateTo] = useState('');
    const [exportFormat, setExportFormat] = useState('json');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchStatistics();
    }, []);

    const showSuccessBanner = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 5000);
    };

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/admin/statistics");
            setStatistics(res.data.data);
        } catch (err) {
            console.error("Failed to fetch statistics:", err);
            setError(err.response?.data?.message || "Gagal memuat data statistik");
        } finally {
            setLoading(false);
        }
    };

    
    const handleGenerateReport = async () => {
        setGeneratingReport(true);
        setError("");
        setReportData(null);
        
        try {
            const params = {
                type: reportType,
                format: reportFormat
            };
            if (reportDateFrom) params.date_from = reportDateFrom;
            if (reportDateTo) params.date_to = reportDateTo;
            
            // Jika format PDF, gunakan responseType blob
            if (reportFormat === 'pdf') {
                const res = await api.get("/admin/reports", { 
                    params,
                    responseType: 'blob'  // PENTING: untuk download file
                });
                
                // Buat download PDF
                const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `laporan-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                showSuccessBanner('Laporan PDF berhasil didownload!');
            } else {
                // Format JSON
                const res = await api.get("/admin/reports", { params });
                setReportData(res.data.data);
                showSuccessBanner('Laporan berhasil digenerate!');
            }
        } catch (err) {
            console.error('Generate report error:', err);
            setError(err.response?.data?.message || 'Gagal generate laporan');
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleExportData = async () => {
        setExporting(true);
        setError("");
        setExportData(null);
        
        try {
            const params = {
                type: exportType,
                format: exportFormat
            };
            if (exportDateFrom) params.date_from = exportDateFrom;
            if (exportDateTo) params.date_to = exportDateTo;
            
            // Tentukan responseType berdasarkan format
            const config = {
                params,
                responseType: exportFormat === 'json' ? 'json' : 'blob'  // blob untuk csv dan pdf
            };
            
            const res = await api.get("/admin/export", config);
            
            if (exportFormat === 'csv') {
                // Download CSV
                const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${exportType}-export-${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                showSuccessBanner('Data berhasil diexport ke CSV!');
                
            } else if (exportFormat === 'pdf') {
                // Download PDF
                const blob = new Blob([res.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${exportType}-export-${new Date().toISOString().split('T')[0]}.pdf`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                showSuccessBanner('Data berhasil diexport ke PDF!');
                
            } else {
                // Format JSON
                setExportData(res.data);
                showSuccessBanner('Data berhasil diexport!');
            }
        } catch (err) {
            console.error('Export error:', err);
            setError(err.response?.data?.message || 'Gagal export data');
        } finally {
            setExporting(false);
        }
    };

    const formatNumber = (num) => {
        return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") || "0";
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getMonthName = (month) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return months[month - 1] || '';
    };

    const StatCard = ({ title, value, icon, bgColor, subtitle }) => (
        <div className="col-xl-3 col-md-6 mb-4">
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
                        <p className="text-muted">Memuat data laporan...</p>
                    </div>
                </div>
            </MainLayouts>
        );
    }

    return (
        <MainLayouts>
            <div className="container-fluid px-0">
                {/* Success & Error Banners */}
                {success && (
                    <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm" role="alert" style={{ borderRadius: '10px' }}>
                        <i className="fas fa-check-circle mr-2"></i><strong>Berhasil!</strong> {success}
                        <button type="button" className="close" onClick={() => setSuccess("")}><span>&times;</span></button>
                    </div>
                )}
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm" role="alert" style={{ borderRadius: '10px' }}>
                        <i className="fas fa-exclamation-triangle mr-2"></i>{error}
                        <button type="button" className="close" onClick={() => setError("")}><span>&times;</span></button>
                    </div>
                )}

                {/* Header Gradient */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div 
                            className="card border-0 shadow-sm"
                            style={{ 
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
                            }}
                        >
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h4 className="text-white mb-2 fw-bold">
                                            <i className="fas fa-chart-bar mr-2"></i>
                                            Laporan & Statistik
                                        </h4>
                                        <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>
                                            Generate laporan, export data, dan lihat statistik sistem
                                        </p>
                                    </div>
                                    <div className="d-none d-md-block">
                                        <i className="fas fa-file-alt text-white" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-2">
                        <ul className="nav nav-pills nav-fill">
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === 'statistics' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('statistics')}
                                    style={{ 
                                        borderRadius: '8px',
                                        backgroundColor: activeTab === 'statistics' ? '#f39c12' : 'transparent',
                                        color: activeTab === 'statistics' ? '#fff' : '#555',
                                        fontWeight: '600',
                                        margin: '4px'
                                    }}
                                >
                                    <i className="fas fa-chart-pie mr-2"></i>Statistik
                                </button>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === 'report' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('report')}
                                    style={{ 
                                        borderRadius: '8px',
                                        backgroundColor: activeTab === 'report' ? '#f39c12' : 'transparent',
                                        color: activeTab === 'report' ? '#fff' : '#555',
                                        fontWeight: '600',
                                        margin: '4px'
                                    }}
                                >
                                    <i className="fas fa-file-contract mr-2"></i>Generate Laporan
                                </button>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === 'export' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('export')}
                                    style={{ 
                                        borderRadius: '8px',
                                        backgroundColor: activeTab === 'export' ? '#f39c12' : 'transparent',
                                        color: activeTab === 'export' ? '#fff' : '#555',
                                        fontWeight: '600',
                                        margin: '4px'
                                    }}
                                >
                                    <i className="fas fa-download mr-2"></i>Export Data
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* ==================== STATISTICS TAB ==================== */}
                {activeTab === 'statistics' && statistics && (
                    <>
                        {/* User Stats */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                    <div className="card-header bg-white border-0 pt-4 pb-3">
                                        <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                                            <i className="fas fa-users text-primary mr-2"></i>
                                            Statistik Pengguna
                                        </h6>
                                    </div>
                                    <div className="card-body pt-0">
                                        <div className="row">
                                            <StatCard 
                                                title="Total Pengguna"
                                                value={statistics.user_stats?.total_users}
                                                icon="fas fa-users"
                                                bgColor="#3498db"
                                            />
                                            <StatCard 
                                                title="Pengguna Aktif"
                                                value={statistics.user_stats?.active_users}
                                                icon="fas fa-user-check"
                                                bgColor="#2ecc71"
                                            />
                                            <StatCard 
                                                title="Society Baru (Bulan Ini)"
                                                value={statistics.user_stats?.new_societies_this_month}
                                                icon="fas fa-user-plus"
                                                bgColor="#9b59b6"
                                            />
                                            <StatCard 
                                                title="Validator Aktif"
                                                value={statistics.user_stats?.active_validators}
                                                icon="fas fa-user-tie"
                                                bgColor="#e67e22"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Validation Stats */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                    <div className="card-header bg-white border-0 pt-4 pb-3">
                                        <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                                            <i className="fas fa-clipboard-check text-success mr-2"></i>
                                            Statistik Validasi
                                        </h6>
                                    </div>
                                    <div className="card-body pt-0">
                                        <div className="row">
                                            <StatCard 
                                                title="Total Validasi"
                                                value={statistics.validation_stats?.total}
                                                icon="fas fa-clipboard-list"
                                                bgColor="#1abc9c"
                                            />
                                            <StatCard 
                                                title="Pending"
                                                value={statistics.validation_stats?.pending}
                                                icon="fas fa-clock"
                                                bgColor="#f39c12"
                                            />
                                            <StatCard 
                                                title="Diterima"
                                                value={statistics.validation_stats?.accepted}
                                                icon="fas fa-check-circle"
                                                bgColor="#2ecc71"
                                            />
                                            <StatCard 
                                                title="Ditolak"
                                                value={statistics.validation_stats?.declined}
                                                icon="fas fa-times-circle"
                                                bgColor="#e74c3c"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Application Stats */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                    <div className="card-header bg-white border-0 pt-4 pb-3">
                                        <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                                            <i className="fas fa-file-alt text-warning mr-2"></i>
                                            Statistik Lamaran
                                        </h6>
                                    </div>
                                    <div className="card-body pt-0">
                                        <div className="row">
                                            <StatCard 
                                                title="Total Lamaran"
                                                value={statistics.application_stats?.total}
                                                icon="fas fa-file-alt"
                                                bgColor="#e74c3c"
                                            />
                                            <StatCard 
                                                title="Pending"
                                                value={statistics.application_stats?.pending}
                                                icon="fas fa-clock"
                                                bgColor="#f39c12"
                                            />
                                            <StatCard 
                                                title="Diterima"
                                                value={statistics.application_stats?.accepted}
                                                icon="fas fa-check-circle"
                                                bgColor="#2ecc71"
                                            />
                                            <StatCard 
                                                title="Ditolak"
                                                value={statistics.application_stats?.rejected}
                                                icon="fas fa-times-circle"
                                                bgColor="#c0392b"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vacancy Stats */}
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                                    <div className="card-header bg-white border-0 pt-4 pb-3">
                                        <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                                            <i className="fas fa-briefcase text-danger mr-2"></i>
                                            Lowongan Terpopuler
                                        </h6>
                                    </div>
                                    <div className="card-body pt-0">
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>#</th>
                                                        <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Perusahaan</th>
                                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Pelamar</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {statistics.vacancy_stats?.most_applied?.map((item, index) => (
                                                        <tr key={item.id}>
                                                            <td style={{ fontWeight: '600' }}>{index + 1}</td>
                                                            <td>{item.company}</td>
                                                            <td className="text-center">
                                                                <span className="badge" style={{ 
                                                                    backgroundColor: '#e8f0fe', 
                                                                    color: '#3498db',
                                                                    padding: '4px 10px', 
                                                                    borderRadius: '20px'
                                                                }}>
                                                                    {item.job_apply_societies_count}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                                    <div className="card-header bg-white border-0 pt-4 pb-3">
                                        <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                                            <i className="fas fa-calendar-alt text-info mr-2"></i>
                                            Lamaran Per Bulan
                                        </h6>
                                    </div>
                                    <div className="card-body pt-0">
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Periode</th>
                                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {statistics.monthly_stats?.applications_per_month?.map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{getMonthName(item.month)} {item.year}</td>
                                                            <td className="text-center">
                                                                <span className="badge" style={{ 
                                                                    backgroundColor: '#fff3cd', 
                                                                    color: '#856404',
                                                                    padding: '4px 10px', 
                                                                    borderRadius: '20px'
                                                                }}>
                                                                    {item.total}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ==================== GENERATE REPORT TAB ==================== */}
                {activeTab === 'report' && (
                    <>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                                    <div className="card-header bg-white border-0 pt-4 pb-3">
                                        <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                                            <i className="fas fa-cog text-primary mr-2"></i>
                                            Parameter Laporan
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="form-group">
                                            <label>Tipe Laporan</label>
                                            <select 
                                                className="form-control" 
                                                value={reportType} 
                                                onChange={(e) => setReportType(e.target.value)}
                                                style={{ borderRadius: '8px' }}
                                            >
                                                <option value="daily">Harian</option>
                                                <option value="weekly">Mingguan</option>
                                                <option value="monthly">Bulanan</option>
                                                <option value="yearly">Tahunan</option>
                                            </select>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>Dari Tanggal</label>
                                                    <input 
                                                        type="date" 
                                                        className="form-control" 
                                                        value={reportDateFrom} 
                                                        onChange={(e) => setReportDateFrom(e.target.value)}
                                                        style={{ borderRadius: '8px' }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>Sampai Tanggal</label>
                                                    <input 
                                                        type="date" 
                                                        className="form-control" 
                                                        value={reportDateTo} 
                                                        onChange={(e) => setReportDateTo(e.target.value)}
                                                        style={{ borderRadius: '8px' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Format</label>
                                            <select 
                                                className="form-control" 
                                                value={reportFormat} 
                                                onChange={(e) => setReportFormat(e.target.value)}
                                                style={{ borderRadius: '8px' }}
                                            >
                                                <option value="json">JSON</option>
                                                <option value="pdf">PDF</option>
                                            </select>
                                        </div>
                                        <button 
                                            className="btn btn-warning btn-block" 
                                            onClick={handleGenerateReport}
                                            disabled={generatingReport}
                                            style={{ borderRadius: '8px', fontWeight: '600' }}
                                        >
                                            {generatingReport ? (
                                                <><i className="fas fa-spinner fa-spin mr-2"></i>Generating...</>
                                            ) : (
                                                <><i className="fas fa-file-contract mr-2"></i>Generate Laporan</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                {reportData && (
                                    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                                        <div className="card-header bg-white border-0 pt-4 pb-3">
                                            <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                                                <i className="fas fa-file-alt text-success mr-2"></i>
                                                Hasil Laporan
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="mb-3">
                                                <small className="text-muted">
                                                    Periode: {formatDate(reportData.period?.from)} - {formatDate(reportData.period?.to)}
                                                </small>
                                            </div>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-bordered">
                                                    <tbody>
                                                        <tr>
                                                            <td style={{ fontSize: '0.85rem' }}>Society Baru</td>
                                                            <td className="text-center" style={{ fontWeight: '600' }}>{reportData.summary?.new_societies}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ fontSize: '0.85rem' }}>Total Society</td>
                                                            <td className="text-center" style={{ fontWeight: '600' }}>{reportData.summary?.total_societies}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ fontSize: '0.85rem' }}>Validasi Baru</td>
                                                            <td className="text-center" style={{ fontWeight: '600' }}>{reportData.summary?.new_validations}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ fontSize: '0.85rem' }}>Validasi Selesai</td>
                                                            <td className="text-center" style={{ fontWeight: '600' }}>{reportData.summary?.validations_completed}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ fontSize: '0.85rem' }}>Lamaran Baru</td>
                                                            <td className="text-center" style={{ fontWeight: '600' }}>{reportData.summary?.new_applications}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ fontSize: '0.85rem' }}>Lamaran Diterima</td>
                                                            <td className="text-center" style={{ fontWeight: '600' }}>{reportData.summary?.applications_accepted}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ fontSize: '0.85rem' }}>Lowongan Baru</td>
                                                            <td className="text-center" style={{ fontWeight: '600' }}>{reportData.summary?.new_job_vacancies}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ==================== EXPORT DATA TAB ==================== */}
                {activeTab === 'export' && (
                    <>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                                    <div className="card-header bg-white border-0 pt-4 pb-3">
                                        <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                                            <i className="fas fa-cog text-primary mr-2"></i>
                                            Parameter Export
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="form-group">
                                            <label>Tipe Data</label>
                                            <select 
                                                className="form-control" 
                                                value={exportType} 
                                                onChange={(e) => setExportType(e.target.value)}
                                                style={{ borderRadius: '8px' }}
                                            >
                                                <option value="societies">Societies (Pencari Kerja)</option>
                                                <option value="validators">Validators</option>
                                                <option value="officers">Officers</option>
                                                <option value="validations">Validations</option>
                                                <option value="applications">Applications (Lamaran)</option>
                                                <option value="vacancies">Job Vacancies (Lowongan)</option>
                                                <option value="full_report">Full Report</option>
                                            </select>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>Dari Tanggal</label>
                                                    <input 
                                                        type="date" 
                                                        className="form-control" 
                                                        value={exportDateFrom} 
                                                        onChange={(e) => setExportDateFrom(e.target.value)}
                                                        style={{ borderRadius: '8px' }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>Sampai Tanggal</label>
                                                    <input 
                                                        type="date" 
                                                        className="form-control" 
                                                        value={exportDateTo} 
                                                        onChange={(e) => setExportDateTo(e.target.value)}
                                                        style={{ borderRadius: '8px' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Format</label>
                                            <select 
                                                className="form-control" 
                                                value={exportFormat} 
                                                onChange={(e) => setExportFormat(e.target.value)}
                                                style={{ borderRadius: '8px' }}
                                            >
                                                <option value="json">JSON</option>
                                                <option value="csv">CSV</option>
                                                <option value="pdf">PDF</option>
                                            </select>
                                        </div>
                                        <button 
                                            className="btn btn-primary btn-block" 
                                            onClick={handleExportData}
                                            disabled={exporting}
                                            style={{ borderRadius: '8px', fontWeight: '600' }}
                                        >
                                            {exporting ? (
                                                <><i className="fas fa-spinner fa-spin mr-2"></i>Exporting...</>
                                            ) : (
                                                <><i className="fas fa-download mr-2"></i>Export Data</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                {exportData && exportFormat === 'json' && (
                                    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                                        <div className="card-header bg-white border-0 pt-4 pb-3">
                                            <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                                                <i className="fas fa-check-circle text-success mr-2"></i>
                                                Hasil Export
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="mb-3">
                                                <span className="badge" style={{ 
                                                    backgroundColor: '#e8f0fe', 
                                                    color: '#3498db',
                                                    padding: '6px 12px', 
                                                    borderRadius: '20px'
                                                }}>
                                                    <i className="fas fa-database mr-1"></i>
                                                    {exportData.total_records} records
                                                </span>
                                                <span className="badge ml-2" style={{ 
                                                    backgroundColor: '#d4edda', 
                                                    color: '#155724',
                                                    padding: '6px 12px', 
                                                    borderRadius: '20px'
                                                }}>
                                                    <i className="fas fa-file mr-1"></i>
                                                    {exportData.format?.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="alert alert-info" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>
                                                <i className="fas fa-info-circle mr-2"></i>
                                                Data berhasil diexport. Buka console atau gunakan tombol download untuk menyimpan.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </MainLayouts>
    );
}