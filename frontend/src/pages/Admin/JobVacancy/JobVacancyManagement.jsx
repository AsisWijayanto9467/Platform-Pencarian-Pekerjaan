import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function JobVacancyManagement() {
    // Data states
    const [vacancyList, setVacancyList] = useState([]);
    const [stats, setStats] = useState(null);
    const [categoryList, setCategoryList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage] = useState(15);
    
    // Filter states
    const [filterCategory, setFilterCategory] = useState("");
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertModalConfig, setAlertModalConfig] = useState({
        title: '', message: '', type: 'info', onConfirm: null
    });
    const [selectedVacancy, setSelectedVacancy] = useState(null);
    const [vacancyDetail, setVacancyDetail] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        job_category_id: '',
        company: '',
        address: '',
        description: '',
        positions: [{ position: '', capacity: 1, apply_capacity: 0 }]
    });
    
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchVacancyList();
        fetchStats();
        fetchCategoryList();
    }, [currentPage, filterCategory]);

    const showAlert = (title, message, type = 'info', onConfirm = null) => {
        setAlertModalConfig({ title, message, type, onConfirm });
        setShowAlertModal(true);
    };

    const showSuccessBanner = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 5000);
    };

    const fetchVacancyList = async () => {
        try {
            setLoading(true);
            setError("");
            const params = { page: currentPage, per_page: itemsPerPage };
            if (searchTerm) params.search = searchTerm;
            if (filterCategory) params.category_id = filterCategory;
            
            const res = await api.get("/admin/job-vacancies", { params });
            setVacancyList(res.data.data.data || []);
            setTotalPages(res.data.data.last_page || 1);
            setTotalItems(res.data.data.total || 0);
        } catch (err) {
            console.error("Failed to fetch job vacancies:", err);
            setError(err.response?.data?.message || "Gagal memuat data lowongan");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get("/admin/job-vacancies/stats");
            setStats(res.data.data);
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    };

    const fetchCategoryList = async () => {
        try {
            const res = await api.get("/admin/job-categories");
            setCategoryList(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch categories:", err);
        }
    };

    const fetchVacancyDetail = async (id) => {
        try {
            setLoadingDetail(true);
            const res = await api.get(`/admin/job-vacancies/${id}`);
            setVacancyDetail(res.data.data);
        } catch (err) {
            console.error("Failed to fetch vacancy detail:", err);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleViewDetail = (vacancy) => {
        setSelectedVacancy(vacancy);
        fetchVacancyDetail(vacancy.id);
        setShowDetailModal(true);
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchVacancyList();
    };

    const handleResetFilter = () => {
        setSearchTerm("");
        setFilterCategory("");
        setCurrentPage(1);
    };

    const paginate = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
    };

    const resetForm = () => {
        setFormData({
            job_category_id: '',
            company: '',
            address: '',
            description: '',
            positions: [{ position: '', capacity: 1, apply_capacity: 0 }]
        });
        setFormErrors({});
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handlePositionChange = (index, field, value) => {
        const updatedPositions = [...formData.positions];
        updatedPositions[index][field] = value;
        setFormData(prev => ({ ...prev, positions: updatedPositions }));
    };

    const addPosition = () => {
        setFormData(prev => ({
            ...prev,
            positions: [...prev.positions, { position: '', capacity: 1, apply_capacity: 0 }]
        }));
    };

    const removePosition = (index) => {
        if (formData.positions.length > 1) {
            const updatedPositions = formData.positions.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, positions: updatedPositions }));
        }
    };

    const validateForm = (data) => {
        const errors = {};
        if (!data.job_category_id) errors.job_category_id = 'Kategori wajib dipilih';
        if (!data.company?.trim()) errors.company = 'Nama perusahaan wajib diisi';
        if (!data.address?.trim()) errors.address = 'Alamat wajib diisi';
        if (!data.description?.trim()) errors.description = 'Deskripsi wajib diisi';
        if (data.positions.length === 0) errors.positions = 'Minimal 1 posisi';
        data.positions.forEach((pos, index) => {
            if (!pos.position?.trim()) errors[`position_${index}`] = 'Nama posisi wajib diisi';
            if (!pos.capacity || pos.capacity < 1) errors[`capacity_${index}`] = 'Kapasitas minimal 1';
        });
        return errors;
    };

    // Create
    const handleCreateClick = () => {
        resetForm();
        setShowCreateModal(true);
    };

    const handleCreateVacancy = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            return;
        }
        setSubmitting(true);
        try {
            const res = await api.post("/admin/job-vacancies", formData);
            setShowCreateModal(false);
            resetForm();
            showSuccessBanner(res.data.message || 'Lowongan berhasil dibuat!');
            fetchVacancyList();
            fetchStats();
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Gagal membuat lowongan', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Edit
    const handleEditClick = (vacancy) => {
        setSelectedVacancy(vacancy);
        setFormData({
            job_category_id: vacancy.job_category_id || '',
            company: vacancy.company || '',
            address: vacancy.address || '',
            description: vacancy.description || '',
            positions: vacancy.available_positions?.map(p => ({
                position: p.position || '',
                capacity: p.capacity || 1,
                apply_capacity: p.apply_capacity || 0
            })) || [{ position: '', capacity: 1, apply_capacity: 0 }]
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    const handleUpdateVacancy = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            return;
        }
        setSubmitting(true);
        try {
            const res = await api.put(`/admin/job-vacancies/${selectedVacancy.id}`, formData);
            setShowEditModal(false);
            setSelectedVacancy(null);
            resetForm();
            showSuccessBanner(res.data.message || 'Lowongan berhasil diperbarui!');
            fetchVacancyList();
            fetchStats();
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Gagal memperbarui lowongan', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete
    const handleDeleteClick = (vacancy) => {
        setSelectedVacancy(vacancy);
        setShowDeleteModal(true);
    };

    const handleDeleteVacancy = async () => {
        setSubmitting(true);
        try {
            const res = await api.delete(`/admin/job-vacancies/${selectedVacancy.id}`);
            setShowDeleteModal(false);
            setSelectedVacancy(null);
            showSuccessBanner(res.data.message || 'Lowongan berhasil dihapus!');
            if (vacancyList.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchVacancyList();
            }
            fetchStats();
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Gagal menghapus lowongan', 'error');
            setShowDeleteModal(false);
        } finally {
            setSubmitting(false);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...'); pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1); pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1); pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...'); pages.push(totalPages);
            }
        }
        return pages;
    };

    const formatNumber = (num) => {
        return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") || "0";
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-times-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    };

    const getAlertColor = (type) => {
        switch (type) {
            case 'success': return '#28a745';
            case 'error': return '#dc3545';
            case 'warning': return '#ffc107';
            default: return '#17a2b8';
        }
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

    if (loading && vacancyList.length === 0) {
        return (
            <MainLayouts>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="text-muted">Memuat data lowongan...</p>
                    </div>
                </div>
            </MainLayouts>
        );
    }

    return (
        <MainLayouts>
            <div className="container-fluid px-0">
                {/* Success Banner */}
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
                                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
                            }}
                        >
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h4 className="text-white mb-2 fw-bold">
                                            <i className="fas fa-briefcase mr-2"></i>
                                            Manajemen Lowongan Kerja
                                        </h4>
                                        <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>
                                            Kelola semua lowongan pekerjaan yang tersedia
                                        </p>
                                    </div>
                                    <div>
                                        <button 
                                            className="btn btn-light" 
                                            onClick={handleCreateClick}
                                            style={{ borderRadius: '10px', fontWeight: '600' }}
                                        >
                                            <i className="fas fa-plus-circle mr-2"></i>Tambah Lowongan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="row">
                    <StatCard 
                        title="Total Lowongan"
                        value={stats?.total_vacancies}
                        icon="fas fa-briefcase"
                        bgColor="#e74c3c"
                        subtitle="Lowongan Aktif"
                    />
                    <StatCard 
                        title="Total Posisi"
                        value={stats?.total_positions}
                        icon="fas fa-list-ol"
                        bgColor="#3498db"
                        subtitle="Posisi Tersedia"
                    />
                    <StatCard 
                        title="Total Lamaran"
                        value={stats?.total_applications}
                        icon="fas fa-file-alt"
                        bgColor="#f39c12"
                        subtitle="Lamaran Masuk"
                    />
                    <StatCard 
                        title="Lamaran Diterima"
                        value={stats?.applications_by_status?.accepted}
                        icon="fas fa-check-circle"
                        bgColor="#2ecc71"
                        subtitle="Diterima"
                    />
                </div>

                {/* Filter & Search Bar */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-4">
                        <div className="row align-items-center">
                            <div className="col-md-4 mb-2 mb-md-0">
                                <div className="input-group">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white border-right-0" style={{ borderRadius: '10px 0 0 10px' }}>
                                            <i className="fas fa-search text-muted"></i>
                                        </span>
                                    </div>
                                    <input 
                                        type="text" 
                                        className="form-control border-left-0" 
                                        placeholder="Cari perusahaan atau deskripsi..."
                                        value={searchTerm} 
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        style={{ borderRadius: '0 10px 10px 0', fontSize: '0.9rem' }} 
                                    />
                                </div>
                            </div>
                            <div className="col-md-3 mb-2 mb-md-0">
                                <select 
                                    className="form-control" 
                                    value={filterCategory} 
                                    onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                                    style={{ borderRadius: '10px', fontSize: '0.9rem' }}
                                >
                                    <option value="">Semua Kategori</option>
                                    {categoryList.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.job_category}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-5 text-md-right">
                                <button className="btn btn-primary mr-2" onClick={handleSearch} style={{ borderRadius: '10px' }}>
                                    <i className="fas fa-search mr-2"></i>Cari
                                </button>
                                <button className="btn btn-outline-secondary mr-2" onClick={handleResetFilter} style={{ borderRadius: '10px' }}>
                                    <i className="fas fa-redo"></i>
                                </button>
                                <button className="btn btn-outline-primary" onClick={fetchVacancyList} style={{ borderRadius: '10px' }}>
                                    <i className="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vacancy Table */}
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead style={{ backgroundColor: '#f8f9fa' }}>
                                    <tr>
                                        <th className="pl-4" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>#</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>PERUSAHAAN</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>KATEGORI</th>
                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>POSISI</th>
                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>PELAMAR</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>TANGGAL</th>
                                        <th className="text-center pr-4" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>AKSI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vacancyList.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                <div className="d-flex flex-column align-items-center justify-content-center">
                                                    <i className="fas fa-briefcase fa-3x text-muted mb-3"></i>
                                                    <span style={{ color: '#888' }}>Belum ada data lowongan</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        vacancyList.map((vacancy, index) => (
                                            <tr key={vacancy.id}>
                                                <td className="pl-4" style={{ fontSize: '0.85rem', color: '#888' }}>
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td>
                                                    <div>
                                                        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                                            <i className="fas fa-building mr-2" style={{ color: '#e74c3c' }}></i>
                                                            {vacancy.company}
                                                        </span>
                                                    </div>
                                                    <small style={{ color: '#888', fontSize: '0.78rem' }}>
                                                        <i className="fas fa-map-marker-alt mr-1"></i>
                                                        {vacancy.address?.substring(0, 40)}{vacancy.address?.length > 40 ? '...' : ''}
                                                    </small>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '0.85rem' }}>
                                                        <i className="fas fa-tag mr-1" style={{ color: '#9b59b6' }}></i>
                                                        {vacancy.job_category?.job_category || '-'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge" style={{ 
                                                        backgroundColor: '#e8f0fe', 
                                                        color: '#3498db',
                                                        padding: '6px 12px', 
                                                        borderRadius: '20px', 
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600'
                                                    }}>
                                                        {vacancy.available_positions?.length || 0} Posisi
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge" style={{ 
                                                        backgroundColor: '#fff3cd', 
                                                        color: '#856404',
                                                        padding: '6px 12px', 
                                                        borderRadius: '20px', 
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600'
                                                    }}>
                                                        <i className="fas fa-users mr-1"></i>
                                                        {vacancy.job_apply_societies_count || 0}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.85rem', color: '#888' }}>
                                                    {formatDate(vacancy.created_at)}
                                                </td>
                                                <td className="text-center pr-4">
                                                    <button 
                                                        className="btn btn-sm btn-info mr-1" 
                                                        onClick={() => handleViewDetail(vacancy)}
                                                        title="Lihat Detail" 
                                                        style={{ borderRadius: '8px', padding: '4px 10px' }}
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-warning mr-1" 
                                                        onClick={() => handleEditClick(vacancy)}
                                                        title="Edit Lowongan" 
                                                        style={{ borderRadius: '8px', padding: '4px 10px' }}
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-danger" 
                                                        onClick={() => handleDeleteClick(vacancy)}
                                                        title="Hapus Lowongan" 
                                                        style={{ borderRadius: '8px', padding: '4px 10px' }}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
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
                                    Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data
                                </small>
                                <nav>
                                    <ul className="pagination pagination-sm mb-0">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => paginate(1)} style={{ borderRadius: '8px 0 0 8px' }}>
                                                <i className="fas fa-angle-double-left"></i>
                                            </button>
                                        </li>
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                                                <i className="fas fa-angle-left"></i>
                                            </button>
                                        </li>
                                        {getPageNumbers().map((page, index) => (
                                            <li key={index} className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}>
                                                <button 
                                                    className="page-link" 
                                                    onClick={() => page !== '...' && paginate(page)}
                                                    style={page === currentPage ? { 
                                                        backgroundColor: '#e74c3c', 
                                                        borderColor: '#e74c3c', 
                                                        color: '#fff',
                                                        fontWeight: 'bold'
                                                    } : {}}
                                                >
                                                    {page}
                                                </button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                                                <i className="fas fa-angle-right"></i>
                                            </button>
                                        </li>
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => paginate(totalPages)} style={{ borderRadius: '0 8px 8px 0' }}>
                                                <i className="fas fa-angle-double-right"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    )}
                </div>

                {/* Most Applied Vacancies */}
                {stats?.most_applied && stats.most_applied.length > 0 && (
                    <div className="row mt-4">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: '12px 12px 0 0' }}>
                                    <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                                        <i className="fas fa-fire text-danger mr-2"></i>
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
                                                    <th className="text-center" style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Jumlah Pelamar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.most_applied.map((item, index) => (
                                                    <tr key={item.id}>
                                                        <td style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                                            {index + 1}
                                                        </td>
                                                        <td style={{ fontSize: '0.9rem' }}>
                                                            <i className="fas fa-building mr-2" style={{ color: '#e74c3c' }}></i>
                                                            {item.company}
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="badge" style={{ 
                                                                backgroundColor: '#e8f0fe', 
                                                                color: '#3498db',
                                                                padding: '6px 12px', 
                                                                borderRadius: '20px', 
                                                                fontSize: '0.85rem',
                                                                fontWeight: '600'
                                                            }}>
                                                                <i className="fas fa-users mr-1"></i>
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
                    </div>
                )}
            </div>

            {/* ==================== ALERT MODAL ==================== */}
            {showAlertModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowAlertModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-body-custom text-center py-4">
                            <div className="mb-3">
                                <i className={`fas ${getAlertIcon(alertModalConfig.type)}`} 
                                    style={{ fontSize: '64px', color: getAlertColor(alertModalConfig.type) }}></i>
                            </div>
                            <h5 style={{ color: getAlertColor(alertModalConfig.type) }}>{alertModalConfig.title}</h5>
                            <p className="text-muted mb-0" style={{ whiteSpace: 'pre-line' }}>{alertModalConfig.message}</p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button className="btn btn-primary px-4" 
                                onClick={() => { setShowAlertModal(false); if (alertModalConfig.onConfirm) alertModalConfig.onConfirm(); }} 
                                style={{ borderRadius: '8px' }}>
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== CREATE/EDIT MODAL ==================== */}
            {(showCreateModal || showEditModal) && (
                <div className="modal-backdrop-custom" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
                    <div className="modal-custom modal-lg-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom text-white" style={{ 
                            borderRadius: '8px 8px 0 0', 
                            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' 
                        }}>
                            <h5 className="modal-title">
                                <i className={`fas fa-${showCreateModal ? 'plus-circle' : 'edit'} mr-2`}></i>
                                {showCreateModal ? 'Tambah Lowongan Baru' : 'Edit Lowongan'}
                            </h5>
                            <button className="close-btn text-white" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={showCreateModal ? handleCreateVacancy : handleUpdateVacancy}>
                            <div className="modal-body-custom">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label><i className="fas fa-tag mr-1" style={{ color: '#9b59b6' }}></i>Kategori <span className="text-danger">*</span></label>
                                            <select 
                                                name="job_category_id" 
                                                className={`form-control ${formErrors.job_category_id ? 'is-invalid' : ''}`}
                                                value={formData.job_category_id} 
                                                onChange={handleFormChange} 
                                                style={{ borderRadius: '8px' }}
                                            >
                                                <option value="">-- Pilih Kategori --</option>
                                                {categoryList.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.job_category}</option>
                                                ))}
                                            </select>
                                            {formErrors.job_category_id && <small className="text-danger">{formErrors.job_category_id}</small>}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label><i className="fas fa-building mr-1" style={{ color: '#e74c3c' }}></i>Perusahaan <span className="text-danger">*</span></label>
                                            <input 
                                                type="text" 
                                                name="company" 
                                                className={`form-control ${formErrors.company ? 'is-invalid' : ''}`}
                                                value={formData.company} 
                                                onChange={handleFormChange} 
                                                placeholder="Nama perusahaan" 
                                                style={{ borderRadius: '8px' }} 
                                            />
                                            {formErrors.company && <small className="text-danger">{formErrors.company}</small>}
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-map-marker-alt mr-1" style={{ color: '#3498db' }}></i>Alamat <span className="text-danger">*</span></label>
                                    <textarea 
                                        name="address" 
                                        rows="2" 
                                        className={`form-control ${formErrors.address ? 'is-invalid' : ''}`}
                                        value={formData.address} 
                                        onChange={handleFormChange} 
                                        placeholder="Alamat lengkap perusahaan" 
                                        style={{ borderRadius: '8px' }}
                                    ></textarea>
                                    {formErrors.address && <small className="text-danger">{formErrors.address}</small>}
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-file-alt mr-1" style={{ color: '#f39c12' }}></i>Deskripsi <span className="text-danger">*</span></label>
                                    <textarea 
                                        name="description" 
                                        rows="3" 
                                        className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                                        value={formData.description} 
                                        onChange={handleFormChange} 
                                        placeholder="Deskripsi lowongan pekerjaan" 
                                        style={{ borderRadius: '8px' }}
                                    ></textarea>
                                    {formErrors.description && <small className="text-danger">{formErrors.description}</small>}
                                </div>
                                
                                {/* Positions */}
                                <div className="form-group">
                                    <label>
                                        <i className="fas fa-list-ol mr-1" style={{ color: '#2ecc71' }}></i>
                                        Posisi Tersedia <span className="text-danger">*</span>
                                    </label>
                                    {formData.positions.map((pos, index) => (
                                        <div key={index} className="row mb-2 align-items-end">
                                            <div className="col-md-5">
                                                <input 
                                                    type="text" 
                                                    className={`form-control form-control-sm ${formErrors[`position_${index}`] ? 'is-invalid' : ''}`}
                                                    placeholder="Nama posisi" 
                                                    value={pos.position} 
                                                    onChange={(e) => handlePositionChange(index, 'position', e.target.value)}
                                                    style={{ borderRadius: '8px' }}
                                                />
                                            </div>
                                            <div className="col-md-2">
                                                <input 
                                                    type="number" 
                                                    className={`form-control form-control-sm ${formErrors[`capacity_${index}`] ? 'is-invalid' : ''}`}
                                                    placeholder="Kapasitas" 
                                                    value={pos.capacity} 
                                                    onChange={(e) => handlePositionChange(index, 'capacity', parseInt(e.target.value) || 0)}
                                                    min="1"
                                                    style={{ borderRadius: '8px' }}
                                                />
                                            </div>
                                            <div className="col-md-2">
                                                <input 
                                                    type="number" 
                                                    className="form-control form-control-sm"
                                                    placeholder="Apply Kapasitas" 
                                                    value={pos.apply_capacity} 
                                                    onChange={(e) => handlePositionChange(index, 'apply_capacity', parseInt(e.target.value) || 0)}
                                                    min="0"
                                                    style={{ borderRadius: '8px' }}
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                {formData.positions.length > 1 && (
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-sm btn-danger" 
                                                        onClick={() => removePosition(index)}
                                                        style={{ borderRadius: '8px' }}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-outline-primary mt-2" 
                                        onClick={addPosition}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <i className="fas fa-plus mr-1"></i>Tambah Posisi
                                    </button>
                                </div>
                            </div>
                            <div className="modal-footer-custom">
                                <button type="button" className="btn btn-light" 
                                    onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} 
                                    disabled={submitting} 
                                    style={{ borderRadius: '8px' }}>
                                    <i className="fas fa-times mr-2"></i>Batal
                                </button>
                                <button type="submit" className="btn text-white" disabled={submitting} 
                                    style={{ 
                                        borderRadius: '8px', 
                                        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', 
                                        border: 'none' 
                                    }}>
                                    {submitting ? (
                                        <><i className="fas fa-spinner fa-spin mr-2"></i>Menyimpan...</>
                                    ) : (
                                        <><i className="fas fa-save mr-2"></i>{showCreateModal ? 'Simpan Lowongan' : 'Perbarui Lowongan'}</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== DELETE MODAL ==================== */}
            {showDeleteModal && selectedVacancy && (
                <div className="modal-backdrop-custom" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-danger text-white" style={{ borderRadius: '8px 8px 0 0' }}>
                            <h5 className="modal-title"><i className="fas fa-trash mr-2"></i>Hapus Lowongan</h5>
                            <button className="close-btn text-white" onClick={() => setShowDeleteModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom text-center py-4">
                            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '64px' }}></i>
                            <h5 className="mt-3">Hapus Lowongan?</h5>
                            <p className="text-muted">Anda akan menghapus lowongan <strong>{selectedVacancy.company}</strong>.</p>
                            <p className="text-danger mb-0">Semua data lamaran terkait akan dihapus permanen.</p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button className="btn btn-light" onClick={() => setShowDeleteModal(false)} disabled={submitting} style={{ borderRadius: '8px' }}>
                                <i className="fas fa-times mr-2"></i>Batal
                            </button>
                            <button className="btn btn-danger" onClick={handleDeleteVacancy} disabled={submitting} style={{ borderRadius: '8px' }}>
                                {submitting ? (
                                    <><i className="fas fa-spinner fa-spin mr-2"></i>Menghapus...</>
                                ) : (
                                    <><i className="fas fa-trash mr-2"></i>Hapus</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== DETAIL MODAL ==================== */}
            {showDetailModal && (
                <div className="modal-backdrop-custom" onClick={() => { setShowDetailModal(false); setVacancyDetail(null); }}>
                    <div className="modal-custom modal-lg-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom text-white" style={{ 
                            borderRadius: '8px 8px 0 0', 
                            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' 
                        }}>
                            <h5 className="modal-title">
                                <i className="fas fa-briefcase mr-2"></i>Detail Lowongan
                            </h5>
                            <button className="close-btn text-white" onClick={() => { setShowDetailModal(false); setVacancyDetail(null); }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom">
                            {loadingDetail ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary mb-3" role="status">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                    <p className="text-muted">Memuat detail lowongan...</p>
                                </div>
                            ) : vacancyDetail ? (
                                <>
                                    <div className="row mb-4">
                                        <div className="col-12">
                                            <div className="card bg-light" style={{ borderRadius: '10px' }}>
                                                <div className="card-body">
                                                    <h5 className="fw-bold mb-2">{vacancyDetail.company}</h5>
                                                    <p className="text-muted mb-1">
                                                        <i className="fas fa-tag mr-1"></i>{vacancyDetail.job_category?.job_category || '-'}
                                                        <span className="mx-2">|</span>
                                                        <i className="fas fa-map-marker-alt mr-1"></i>{vacancyDetail.address}
                                                    </p>
                                                    <p className="text-muted mb-0">
                                                        <i className="fas fa-file-alt mr-1"></i>{vacancyDetail.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Available Positions */}
                                    <div className="mb-4">
                                        <h6 className="fw-bold" style={{ fontSize: '0.9rem' }}>
                                            <i className="fas fa-list-ol text-primary mr-2"></i>
                                            Posisi Tersedia ({vacancyDetail.available_positions?.length || 0})
                                        </h6>
                                        <div className="table-responsive">
                                            <table className="table table-sm table-bordered">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th>Posisi</th>
                                                        <th className="text-center">Kapasitas</th>
                                                        <th className="text-center">Apply Kapasitas</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {vacancyDetail.available_positions?.map((pos) => (
                                                        <tr key={pos.id}>
                                                            <td>{pos.position}</td>
                                                            <td className="text-center">{pos.capacity}</td>
                                                            <td className="text-center">{pos.apply_capacity}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Recent Applicants */}
                                    {vacancyDetail.job_apply_societies && vacancyDetail.job_apply_societies.length > 0 && (
                                        <div className="mb-3">
                                            <h6 className="fw-bold" style={{ fontSize: '0.9rem' }}>
                                                <i className="fas fa-users text-success mr-2"></i>
                                                Pelamar Terbaru ({vacancyDetail.job_apply_societies_count || 0})
                                            </h6>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-bordered">
                                                    <thead className="bg-light">
                                                        <tr>
                                                            <th>Nama</th>
                                                            <th>No. KTP</th>
                                                            <th>Posisi Dilamar</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {vacancyDetail.job_apply_societies.map((app) => (
                                                            <tr key={app.id}>
                                                                <td>{app.society?.name || '-'}</td>
                                                                <td>{app.society?.id_card_number || '-'}</td>
                                                                <td>
                                                                    {app.job_apply_positions?.map(p => p.position?.position).join(', ') || '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    <div className="row mt-3">
                                        <div className="col-6">
                                            <small className="text-muted">Dibuat: {formatDate(vacancyDetail.created_at)}</small>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-5">
                                    <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '48px' }}></i>
                                    <p className="text-muted mt-3">Gagal memuat detail lowongan</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer-custom">
                            <button className="btn btn-secondary" 
                                onClick={() => { setShowDetailModal(false); setVacancyDetail(null); }} 
                                style={{ borderRadius: '8px' }}>
                                <i className="fas fa-times mr-2"></i>Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== CUSTOM MODAL STYLES ==================== */}
            <style>{`
                .modal-backdrop-custom { 
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                    background-color: rgba(0,0,0,0.5); 
                    display: flex; align-items: center; justify-content: center; 
                    z-index: 2000; padding: 20px; 
                }
                .modal-custom { 
                    background: white; border-radius: 8px; 
                    width: 650px; max-width: 100%; 
                    max-height: 90vh; overflow-y: auto; 
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
                }
                .modal-lg-custom { width: 800px; }
                .modal-sm-custom { width: 450px; }
                .modal-header-custom { 
                    padding: 16px 20px; border-bottom: 1px solid #dee2e6; 
                    display: flex; justify-content: space-between; align-items: center; 
                }
                .modal-body-custom { padding: 20px; }
                .modal-footer-custom { 
                    padding: 16px 20px; border-top: 1px solid #dee2e6; 
                    display: flex; justify-content: flex-end; gap: 10px; 
                }
                .close-btn { 
                    background: none; border: none; font-size: 20px; 
                    cursor: pointer; padding: 0; 
                }
                .close-btn:hover { opacity: 0.8; }
            `}</style>
        </MainLayouts>
    );
}