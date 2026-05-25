import React, { useState } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function ValidatorReport() {
    // Data states
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [generating, setGenerating] = useState(false);
    const [downloading, setDownloading] = useState(false);
    
    // Filter states
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const showSuccessBanner = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 5000);
    };

    const formatNumber = (num) => {
        return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") || "0";
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateShort = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
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

    const handleGenerateReport = async () => {
        setGenerating(true);
        setError("");
        setReportData(null);
        
        try {
            const params = {};
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            
            const res = await api.get("/validator/reports", { params });
            setReportData(res.data.data);
            showSuccessBanner('Laporan berhasil digenerate!');
        } catch (err) {
            console.error("Failed to generate report:", err);
            setError(err.response?.data?.message || 'Gagal generate laporan');
        } finally {
            setGenerating(false);
        }
    };

    // Fungsi untuk download PDF
    const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
            const params = {
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                format: 'pdf'
            };
            
            // Panggil API dengan responseType blob untuk PDF
            const res = await api.get("/validator/reports", { 
                params,
                responseType: 'blob'
            });
            
            // Buat URL dan trigger download
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `laporan-validator-${new Date().toISOString().slice(0, 10)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            showSuccessBanner('PDF berhasil didownload!');
        } catch (err) {
            console.error("Failed to download PDF:", err);
            
            // Jika API belum support PDF, generate PDF dari data yang ada
            if (reportData) {
                generatePDFFromData();
            } else {
                setError('Gagal mendownload PDF. Silahkan generate laporan terlebih dahulu.');
            }
        } finally {
            setDownloading(false);
        }
    };

    // Fallback: Generate PDF dari data report yang sudah ada (client-side)
    const generatePDFFromData = () => {
        if (!reportData) return;
        
        // Buat konten HTML untuk PDF
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laporan Validator</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3498db; padding-bottom: 15px; }
                    .header h1 { color: #2c3e50; margin: 0; font-size: 22px; }
                    .header p { color: #7f8c8d; margin: 5px 0; font-size: 13px; }
                    .summary { display: flex; gap: 15px; margin-bottom: 25px; }
                    .summary-card { flex: 1; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #ddd; }
                    .summary-card h3 { margin: 0 0 5px 0; font-size: 24px; }
                    .summary-card p { margin: 0; font-size: 12px; color: #888; }
                    .accepted { color: #27ae60; }
                    .declined { color: #e74c3c; }
                    .total { color: #3498db; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background-color: #f8f9fa; padding: 10px; text-align: left; font-size: 12px; color: #888; border-bottom: 2px solid #dee2e6; }
                    td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 13px; }
                    .status-badge { padding: 4px 10px; border-radius: 15px; font-size: 11px; font-weight: bold; }
                    .status-accepted { background-color: #d4edda; color: #155724; }
                    .status-declined { background-color: #f8d7da; color: #721c24; }
                    .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>LAPORAN VALIDASI</h1>
                    <p>Periode: ${formatDateShort(reportData.period?.from)} - ${formatDateShort(reportData.period?.to)}</p>
                    <p>Generated by: ${reportData.generated_by || '-'} | Role: ${reportData.role || '-'}</p>
                    <p>Generated at: ${formatDate(reportData.generated_at)}</p>
                </div>
                
                <div class="summary">
                    <div class="summary-card">
                        <h3 class="total">${formatNumber(reportData.summary?.total_validations_processed || 0)}</h3>
                        <p>Total Diproses</p>
                    </div>
                    <div class="summary-card">
                        <h3 class="accepted">${formatNumber(reportData.summary?.validations_accepted || 0)}</h3>
                        <p>Disetujui</p>
                    </div>
                    <div class="summary-card">
                        <h3 class="declined">${formatNumber(reportData.summary?.validations_declined || 0)}</h3>
                        <p>Ditolak</p>
                    </div>
                </div>
                
                <h3 style="color: #2c3e50; font-size: 16px;">Daftar Validasi</h3>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Pencari Kerja</th>
                            <th>Kategori</th>
                            <th>Status</th>
                            <th>Tanggal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.validations?.map((v, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${v.society?.name || '-'}</td>
                                <td>${v.job_category?.job_category || '-'}</td>
                                <td>
                                    <span class="status-badge status-${v.status}">
                                        ${v.status === 'accepted' ? 'Disetujui' : 'Ditolak'}
                                    </span>
                                </td>
                                <td>${formatDate(v.updated_at || v.created_at)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                ${reportData.application_summary ? `
                    <h3 style="color: #2c3e50; font-size: 16px; margin-top: 25px;">Ringkasan Lamaran (Officer)</h3>
                    <div class="summary">
                        <div class="summary-card">
                            <h3 class="total">${formatNumber(reportData.application_summary.total_processed || 0)}</h3>
                            <p>Total Diproses</p>
                        </div>
                        <div class="summary-card">
                            <h3 class="accepted">${formatNumber(reportData.application_summary.accepted || 0)}</h3>
                            <p>Diterima</p>
                        </div>
                        <div class="summary-card">
                            <h3 class="declined">${formatNumber(reportData.application_summary.rejected || 0)}</h3>
                            <p>Ditolak</p>
                        </div>
                    </div>
                ` : ''}
                
                <div class="footer">
                    <p>Dokumen ini digenerate otomatis oleh sistem JobPortal</p>
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `;
        
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleResetFilter = () => {
        setDateFrom("");
        setDateTo("");
        setReportData(null);
        setError("");
    };

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
                                background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)'
                            }}
                        >
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h4 className="text-white mb-2 fw-bold">
                                            <i className="fas fa-file-alt mr-2"></i>
                                            Laporan Validasi
                                        </h4>
                                        <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>
                                            Generate laporan kinerja validasi Anda
                                        </p>
                                    </div>
                                    <div className="d-none d-md-block">
                                        <i className="fas fa-chart-bar text-white" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter & Generate Section */}
                <div className="row">
                    <div className="col-lg-5 mb-4">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: '12px 12px 0 0' }}>
                                <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                                    <i className="fas fa-filter text-primary mr-2"></i>
                                    Parameter Laporan
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', color: '#888' }}>
                                        <i className="fas fa-calendar-alt mr-1"></i>Dari Tanggal
                                    </label>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        value={dateFrom} 
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        style={{ borderRadius: '8px' }}
                                    />
                                    <small className="text-muted">Kosongkan untuk awal bulan ini</small>
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', color: '#888' }}>
                                        <i className="fas fa-calendar-check mr-1"></i>Sampai Tanggal
                                    </label>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        value={dateTo} 
                                        onChange={(e) => setDateTo(e.target.value)}
                                        style={{ borderRadius: '8px' }}
                                    />
                                    <small className="text-muted">Kosongkan untuk hari ini</small>
                                </div>
                                
                                <div className="d-flex gap-2 mt-3">
                                    <button 
                                        className="btn btn-primary flex-grow-1" 
                                        onClick={handleGenerateReport}
                                        disabled={generating}
                                        style={{ borderRadius: '8px', fontWeight: '600' }}
                                    >
                                        {generating ? (
                                            <><i className="fas fa-spinner fa-spin mr-2"></i>Generating...</>
                                        ) : (
                                            <><i className="fas fa-file-contract mr-2"></i>Generate Laporan</>
                                        )}
                                    </button>
                                    <button 
                                        className="btn btn-outline-secondary" 
                                        onClick={handleResetFilter}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <i className="fas fa-redo"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Result */}
                    <div className="col-lg-7 mb-4">
                        {reportData ? (
                            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: '12px 12px 0 0' }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                                            <i className="fas fa-file-alt text-success mr-2"></i>
                                            Hasil Laporan
                                        </h6>
                                        <button 
                                            className="btn btn-danger btn-sm" 
                                            onClick={handleDownloadPDF}
                                            disabled={downloading}
                                            style={{ borderRadius: '8px' }}
                                        >
                                            {downloading ? (
                                                <><i className="fas fa-spinner fa-spin mr-1"></i>Downloading...</>
                                            ) : (
                                                <><i className="fas fa-file-pdf mr-1"></i>Download PDF</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body pt-0">
                                    {/* Report Info */}
                                    <div className="mb-3">
                                        <small className="text-muted">
                                            Generated by: <strong>{reportData.generated_by}</strong> | 
                                            Role: <span className="badge" style={{ 
                                                backgroundColor: reportData.role === 'officer' ? '#fdf2e9' : '#e8f8f0',
                                                color: reportData.role === 'officer' ? '#e67e22' : '#2ecc71',
                                                fontSize: '0.75rem'
                                            }}>{reportData.role}</span>
                                        </small>
                                        <br />
                                        <small className="text-muted">
                                            Periode: {formatDateShort(reportData.period?.from)} - {formatDateShort(reportData.period?.to)}
                                        </small>
                                    </div>

                                    {/* Summary Cards */}
                                    <div className="row mb-3">
                                        <div className="col-4">
                                            <div className="card bg-light text-center" style={{ borderRadius: '10px' }}>
                                                <div className="card-body py-3">
                                                    <h4 className="mb-0" style={{ color: '#3498db', fontWeight: 'bold' }}>
                                                        {formatNumber(reportData.summary?.total_validations_processed || 0)}
                                                    </h4>
                                                    <small style={{ color: '#888', fontSize: '0.75rem' }}>Total Diproses</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="card bg-light text-center" style={{ borderRadius: '10px' }}>
                                                <div className="card-body py-3">
                                                    <h4 className="mb-0" style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                                                        {formatNumber(reportData.summary?.validations_accepted || 0)}
                                                    </h4>
                                                    <small style={{ color: '#888', fontSize: '0.75rem' }}>Disetujui</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="card bg-light text-center" style={{ borderRadius: '10px' }}>
                                                <div className="card-body py-3">
                                                    <h4 className="mb-0" style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                                                        {formatNumber(reportData.summary?.validations_declined || 0)}
                                                    </h4>
                                                    <small style={{ color: '#888', fontSize: '0.75rem' }}>Ditolak</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Application Summary (Officer Only) */}
                                    {reportData.application_summary && (
                                        <div className="row mb-3">
                                            <div className="col-12">
                                                <h6 style={{ fontSize: '0.85rem', color: '#888' }}>Ringkasan Lamaran</h6>
                                            </div>
                                            <div className="col-4">
                                                <div className="card bg-light text-center" style={{ borderRadius: '10px' }}>
                                                    <div className="card-body py-2">
                                                        <h5 className="mb-0" style={{ color: '#3498db', fontWeight: 'bold' }}>
                                                            {formatNumber(reportData.application_summary.total_processed || 0)}
                                                        </h5>
                                                        <small style={{ color: '#888', fontSize: '0.7rem' }}>Total</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <div className="card bg-light text-center" style={{ borderRadius: '10px' }}>
                                                    <div className="card-body py-2">
                                                        <h5 className="mb-0" style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                                                            {formatNumber(reportData.application_summary.accepted || 0)}
                                                        </h5>
                                                        <small style={{ color: '#888', fontSize: '0.7rem' }}>Diterima</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <div className="card bg-light text-center" style={{ borderRadius: '10px' }}>
                                                    <div className="card-body py-2">
                                                        <h5 className="mb-0" style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                                                            {formatNumber(reportData.application_summary.rejected || 0)}
                                                        </h5>
                                                        <small style={{ color: '#888', fontSize: '0.7rem' }}>Ditolak</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Validations Table */}
                                    <h6 style={{ fontSize: '0.85rem', color: '#888', marginTop: '15px' }}>
                                        Daftar Validasi ({reportData.validations?.length || 0})
                                    </h6>
                                    <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <table className="table table-sm table-hover">
                                            <thead>
                                                <tr>
                                                    <th style={{ fontSize: '0.75rem', color: '#888' }}>#</th>
                                                    <th style={{ fontSize: '0.75rem', color: '#888' }}>Pencari Kerja</th>
                                                    <th style={{ fontSize: '0.75rem', color: '#888' }}>Kategori</th>
                                                    <th className="text-center" style={{ fontSize: '0.75rem', color: '#888' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.validations?.map((v, index) => {
                                                    const status = getStatusBadge(v.status);
                                                    return (
                                                        <tr key={v.id || index}>
                                                            <td style={{ fontSize: '0.8rem' }}>{index + 1}</td>
                                                            <td style={{ fontSize: '0.85rem' }}>{v.society?.name || '-'}</td>
                                                            <td style={{ fontSize: '0.8rem' }}>{v.job_category?.job_category || '-'}</td>
                                                            <td className="text-center">
                                                                <span className="badge" style={{ 
                                                                    backgroundColor: status.bg, 
                                                                    color: status.color,
                                                                    padding: '3px 8px', 
                                                                    borderRadius: '20px', 
                                                                    fontSize: '0.7rem'
                                                                }}>
                                                                    {status.label}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                <div className="card-body text-center py-5">
                                    <i className="fas fa-file-alt fa-3x text-muted mb-3 d-block"></i>
                                    <p className="text-muted">Generate laporan untuk melihat hasil</p>
                                    <small className="text-muted">
                                        Atur parameter dan klik "Generate Laporan"
                                    </small>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayouts>
    );
}