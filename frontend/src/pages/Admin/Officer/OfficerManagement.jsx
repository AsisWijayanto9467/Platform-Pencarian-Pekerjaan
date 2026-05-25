import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function OfficerManagement() {
    // Data states
    const [officerList, setOfficerList] = useState([]);
    const [regionalList, setRegionalList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertModalConfig, setAlertModalConfig] = useState({
        title: '', message: '', type: 'info', onConfirm: null
    });
    const [selectedOfficer, setSelectedOfficer] = useState(null);
    const [officerDetail, setOfficerDetail] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [togglingId, setTogglingId] = useState(null);
    
    // Form states
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', password_confirmation: '',
        phone: '', employee_id: '', regional_id: ''
    });
    
    const [editFormData, setEditFormData] = useState({
        name: '', phone: '', employee_id: '', regional_id: '', is_active: true
    });
    
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchOfficerList();
        fetchRegionalList();
    }, []);

    const showAlert = (title, message, type = 'info', onConfirm = null) => {
        setAlertModalConfig({ title, message, type, onConfirm });
        setShowAlertModal(true);
    };

    const showSuccessBanner = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 3000);
    };

    const formatBackendErrors = (errors) => {
        if (!errors) return '';
        if (typeof errors === 'string') return errors;
        if (typeof errors === 'object') {
            const messages = [];
            Object.keys(errors).forEach(key => {
                const fieldErrors = errors[key];
                if (Array.isArray(fieldErrors)) messages.push(...fieldErrors);
                else if (typeof fieldErrors === 'string') messages.push(fieldErrors);
            });
            return messages.join('\n');
        }
        return 'Terjadi kesalahan';
    };

    const fetchOfficerList = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/admin/officers");
            setOfficerList(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch officers:", err);
            const errorMsg = err.response?.data?.message || "Gagal memuat data officer";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const fetchRegionalList = async () => {
        try {
            const res = await api.get("/admin/regionals");
            setRegionalList(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch regionals:", err);
        }
    };

    const fetchOfficerDetail = async (id) => {
        try {
            const res = await api.get(`/admin/officers/${id}`);
            setOfficerDetail(res.data.data);
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Gagal memuat detail officer', 'error');
        }
    };

    // Filter & Search
    const filteredOfficers = officerList.filter(officer => {
        const searchLower = searchTerm.toLowerCase();
        return (
            officer.name?.toLowerCase().includes(searchLower) ||
            officer.email?.toLowerCase().includes(searchLower) ||
            officer.employee_id?.toLowerCase().includes(searchLower) ||
            officer.regional?.province?.toLowerCase().includes(searchLower) ||
            officer.regional?.district?.toLowerCase().includes(searchLower)
        );
    });

    // Pagination
    const totalPages = Math.ceil(filteredOfficers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOfficers.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', password_confirmation: '', phone: '', employee_id: '', regional_id: '' });
        setFormErrors({});
    };

    const resetEditForm = () => {
        setEditFormData({ name: '', phone: '', employee_id: '', regional_id: '', is_active: true });
        setFormErrors({});
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleEditInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = (data, isEdit = false) => {
        const errors = {};
        if (!data.name?.trim()) errors.name = 'Nama wajib diisi';
        if (!isEdit) {
            if (!data.email?.trim()) errors.email = 'Email wajib diisi';
            if (!data.password?.trim()) errors.password = 'Password wajib diisi';
            if (data.password && data.password.length < 8) errors.password = 'Password minimal 8 karakter';
            if (data.password !== data.password_confirmation) errors.password_confirmation = 'Konfirmasi password tidak cocok';
        }
        if (!data.employee_id?.trim()) errors.employee_id = 'ID Karyawan wajib diisi';
        if (!data.regional_id) errors.regional_id = 'Regional wajib dipilih';
        return errors;
    };

    // Create officer
    const handleCreateOfficer = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            showAlert('Validasi Gagal', Object.values(validationErrors).join('\n'), 'warning');
            return;
        }
        setSubmitting(true);
        setFormErrors({});
        try {
            const res = await api.post("/admin/officers", { ...formData, role: 'officer' });
            setShowCreateModal(false);
            resetForm();
            showSuccessBanner(res.data.message || 'Officer berhasil ditambahkan!');
            fetchOfficerList();
        } catch (err) {
            const responseData = err.response?.data;
            if (responseData?.errors) {
                setFormErrors(responseData.errors);
                showAlert('Validasi Gagal', formatBackendErrors(responseData.errors), 'warning');
            } else {
                showAlert('Error', responseData?.message || 'Gagal menambah officer', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (officer) => {
        setSelectedOfficer(officer);
        setEditFormData({
            name: officer.name || '',
            phone: officer.phone || '',
            employee_id: officer.employee_id || '',
            regional_id: officer.regional?.id || '',
            is_active: officer.is_active === 1 || officer.is_active === true
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    // Update officer
    const handleUpdateOfficer = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm(editFormData, true);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            showAlert('Validasi Gagal', Object.values(validationErrors).join('\n'), 'warning');
            return;
        }
        setSubmitting(true);
        setFormErrors({});
        try {
            const res = await api.put(`/admin/officers/${selectedOfficer.id}`, editFormData);
            setShowEditModal(false);
            setSelectedOfficer(null);
            resetEditForm();
            showSuccessBanner(res.data.message || 'Officer berhasil diperbarui!');
            fetchOfficerList();
        } catch (err) {
            const responseData = err.response?.data;
            if (responseData?.errors) {
                setFormErrors(responseData.errors);
                showAlert('Error', formatBackendErrors(responseData.errors), 'error');
            } else {
                showAlert('Error', responseData?.message || 'Gagal memperbarui officer', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle status
    const handleToggleStatus = async (officer) => {
        setTogglingId(officer.id);
        try {
            const res = await api.patch(`/admin/officers/${officer.id}/toggle-status`);
            showSuccessBanner(res.data.message || `Officer ${res.data.data.is_active ? 'diaktifkan' : 'dinonaktifkan'}!`);
            fetchOfficerList();
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Gagal mengubah status', 'error');
        } finally {
            setTogglingId(null);
        }
    };

    // Delete officer
    const handleDeleteClick = (officer) => {
        setSelectedOfficer(officer);
        setShowDeleteModal(true);
    };

    const handleDeleteOfficer = async () => {
        setSubmitting(true);
        try {
            const res = await api.delete(`/admin/officers/${selectedOfficer.id}`);
            setShowDeleteModal(false);
            setSelectedOfficer(null);
            showSuccessBanner(res.data.message || 'Officer berhasil dihapus!');
            fetchOfficerList();
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Gagal menghapus officer', 'error');
            setShowDeleteModal(false);
        } finally {
            setSubmitting(false);
        }
    };

    // View detail
    const handleViewDetail = async (officer) => {
        setSelectedOfficer(officer);
        await fetchOfficerDetail(officer.id);
        setShowDetailModal(true);
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

    if (loading) {
        return (
            <MainLayouts>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="text-muted">Memuat data officer...</p>
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
                {/* Error Banner */}
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm" role="alert" style={{ borderRadius: '10px' }}>
                        <i className="fas fa-exclamation-triangle mr-2"></i>{error}
                        <button type="button" className="close" onClick={() => setError("")}><span>&times;</span></button>
                    </div>
                )}

                {/* Header Gradient Biru */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h4 className="text-white mb-2 fw-bold">
                                            <i className="fas fa-user-tie mr-2"></i>Kelola Officer
                                        </h4>
                                        <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>
                                            Manajemen data officer / petugas lowongan
                                        </p>
                                    </div>
                                    <button className="btn btn-light" onClick={() => { resetForm(); setShowCreateModal(true); }}
                                        style={{ borderRadius: '10px', fontWeight: '600' }}>
                                        <i className="fas fa-plus mr-2"></i>Tambah Officer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="row mb-4">
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', borderLeft: '4px solid #3498db' }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <small style={{ color: '#888', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Officer</small>
                                        <h3 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>{officerList.length}</h3>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-center"
                                        style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e8f0fe' }}>
                                        <i className="fas fa-user-tie text-primary" style={{ fontSize: '20px' }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', borderLeft: '4px solid #2ecc71' }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <small style={{ color: '#888', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Officer Aktif</small>
                                        <h3 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>{officerList.filter(o => o.is_active).length}</h3>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-center"
                                        style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e8f8f0' }}>
                                        <i className="fas fa-check-circle text-success" style={{ fontSize: '20px' }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', borderLeft: '4px solid #e67e22' }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <small style={{ color: '#888', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Lowongan</small>
                                        <h3 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                                            {officerList.reduce((sum, o) => sum + (o.total_vacancies || 0), 0)}
                                        </h3>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-center"
                                        style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fef3e8' }}>
                                        <i className="fas fa-briefcase text-warning" style={{ fontSize: '20px' }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-4">
                        <div className="row align-items-center">
                            <div className="col-md-6">
                                <div className="input-group">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white border-right-0" style={{ borderRadius: '10px 0 0 10px' }}>
                                            <i className="fas fa-search text-muted"></i>
                                        </span>
                                    </div>
                                    <input type="text" className="form-control border-left-0" 
                                        placeholder="Cari berdasarkan nama, email, ID karyawan, atau regional..."
                                        value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        style={{ borderRadius: '0 10px 10px 0', fontSize: '0.9rem' }} />
                                    {searchTerm && (
                                        <div className="input-group-append">
                                            <button className="btn btn-outline-secondary" onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
                                                style={{ borderRadius: '10px', marginLeft: '8px' }}><i className="fas fa-times"></i></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6 text-md-right mt-2 mt-md-0">
                                <button className="btn btn-outline-primary mr-2" onClick={fetchOfficerList} style={{ borderRadius: '10px' }}>
                                    <i className="fas fa-sync-alt mr-2"></i>Refresh
                                </button>
                                <small className="text-muted">Menampilkan {currentItems.length} dari {filteredOfficers.length} officer</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Officer Table */}
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead style={{ backgroundColor: '#f8f9fa' }}>
                                    <tr>
                                        <th className="pl-4" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>#</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>NAMA / EMAIL</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>ID KARYAWAN</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>REGIONAL</th>
                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>STATUS</th>
                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>LOWONGAN</th>
                                        <th className="text-center pr-4" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>AKSI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                <i className="fas fa-user-tie fa-3x text-muted mb-3 d-block"></i>
                                                <span style={{ color: '#888' }}>
                                                    {searchTerm ? 'Tidak ada officer yang cocok dengan pencarian' : 'Belum ada data officer'}
                                                </span>
                                                {!searchTerm && (
                                                    <button className="btn btn-sm btn-primary mt-3 d-block mx-auto"
                                                        onClick={() => { resetForm(); setShowCreateModal(true); }} style={{ borderRadius: '8px' }}>
                                                        <i className="fas fa-plus mr-1"></i> Tambah Officer Pertama
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((officer, index) => (
                                            <tr key={officer.id}>
                                                <td className="pl-4" style={{ fontSize: '0.85rem', color: '#888' }}>{indexOfFirstItem + index + 1}</td>
                                                <td>
                                                    <div>
                                                        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                                            <i className="fas fa-user-tie mr-2" style={{ color: '#3498db' }}></i>{officer.name}
                                                        </span>
                                                    </div>
                                                    <small style={{ color: '#888', fontSize: '0.8rem' }}>
                                                        <i className="fas fa-envelope mr-1"></i>{officer.email || '-'}
                                                    </small>
                                                </td>
                                                <td><span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{officer.employee_id || '-'}</span></td>
                                                <td>
                                                    {officer.regional ? (
                                                        <span style={{ fontSize: '0.82rem' }}>
                                                            <i className="fas fa-map-marker-alt text-danger mr-1"></i>
                                                            {officer.regional.province} - {officer.regional.district}
                                                        </span>
                                                    ) : <span className="text-muted">-</span>}
                                                </td>
                                                <td className="text-center">
                                                    <button className="badge border-0"
                                                        onClick={() => handleToggleStatus(officer)}
                                                        disabled={togglingId === officer.id}
                                                        style={{ 
                                                            backgroundColor: officer.is_active ? '#e8f8f0' : '#fde8e8',
                                                            color: officer.is_active ? '#2ecc71' : '#e74c3c',
                                                            padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem',
                                                            cursor: 'pointer', transition: 'all 0.2s'
                                                        }}
                                                        title="Klik untuk toggle status">
                                                        {togglingId === officer.id ? (
                                                            <i className="fas fa-spinner fa-spin"></i>
                                                        ) : (
                                                            <><i className={`fas fa-${officer.is_active ? 'check-circle' : 'times-circle'} mr-1`}></i>
                                                            {officer.is_active ? 'Aktif' : 'Nonaktif'}</>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge" style={{ backgroundColor: '#e8f0fe', color: '#3498db', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>
                                                        {officer.total_vacancies || 0}
                                                    </span>
                                                </td>
                                                <td className="text-center pr-4">
                                                    <button className="btn btn-sm btn-info mr-1" onClick={() => handleViewDetail(officer)}
                                                        title="Lihat Detail" style={{ borderRadius: '8px', padding: '4px 10px' }}><i className="fas fa-eye"></i></button>
                                                    <button className="btn btn-sm btn-warning mr-1" onClick={() => handleEditClick(officer)}
                                                        title="Edit Officer" style={{ borderRadius: '8px', padding: '4px 10px' }}><i className="fas fa-edit"></i></button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteClick(officer)}
                                                        title="Hapus Officer" style={{ borderRadius: '8px', padding: '4px 10px' }}><i className="fas fa-trash"></i></button>
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
                                <small className="text-muted">Halaman {currentPage} dari {totalPages} ({filteredOfficers.length} total officer)</small>
                                <nav>
                                    <ul className="pagination pagination-sm mb-0">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => paginate(1)} style={{ borderRadius: '8px 0 0 8px' }}><i className="fas fa-angle-double-left"></i></button>
                                        </li>
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => paginate(currentPage - 1)}><i className="fas fa-angle-left"></i></button>
                                        </li>
                                        {getPageNumbers().map((page, index) => (
                                            <li key={index} className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => page !== '...' && paginate(page)}
                                                    style={page === currentPage ? { backgroundColor: '#3498db', borderColor: '#3498db', color: '#fff' } : {}}>{page}</button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => paginate(currentPage + 1)}><i className="fas fa-angle-right"></i></button>
                                        </li>
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => paginate(totalPages)} style={{ borderRadius: '0 8px 8px 0' }}><i className="fas fa-angle-double-right"></i></button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ==================== ALERT MODAL ==================== */}
            {showAlertModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowAlertModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-body-custom text-center py-4">
                            <div className="mb-3">
                                <i className={`fas ${getAlertIcon(alertModalConfig.type)}`} style={{ fontSize: '64px', color: getAlertColor(alertModalConfig.type) }}></i>
                            </div>
                            <h5 style={{ color: getAlertColor(alertModalConfig.type) }}>{alertModalConfig.title}</h5>
                            <p className="text-muted mb-0" style={{ whiteSpace: 'pre-line' }}>{alertModalConfig.message}</p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button className="btn btn-primary px-4" onClick={() => { setShowAlertModal(false); if (alertModalConfig.onConfirm) alertModalConfig.onConfirm(); }} style={{ borderRadius: '8px' }}>OK</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== CREATE MODAL ==================== */}
            {showCreateModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom text-white" style={{ borderRadius: '8px 8px 0 0', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' }}>
                            <h5 className="modal-title"><i className="fas fa-plus-circle mr-2"></i>Tambah Officer Baru</h5>
                            <button className="close-btn text-white" onClick={() => setShowCreateModal(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleCreateOfficer}>
                            <div className="modal-body-custom">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label><i className="fas fa-user mr-1" style={{ color: '#3498db' }}></i>Nama <span className="text-danger">*</span></label>
                                            <input type="text" name="name" className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                                                value={formData.name} onChange={handleInputChange} placeholder="Nama lengkap" required style={{ borderRadius: '8px' }} />
                                            {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label><i className="fas fa-envelope mr-1" style={{ color: '#e67e22' }}></i>Email <span className="text-danger">*</span></label>
                                            <input type="email" name="email" className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                                                value={formData.email} onChange={handleInputChange} placeholder="Email officer" required style={{ borderRadius: '8px' }} />
                                            {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label><i className="fas fa-lock mr-1" style={{ color: '#e74c3c' }}></i>Password <span className="text-danger">*</span></label>
                                            <input type="password" name="password" className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                                                value={formData.password} onChange={handleInputChange} placeholder="Minimal 8 karakter" required style={{ borderRadius: '8px' }} />
                                            {formErrors.password && <div className="invalid-feedback">{formErrors.password}</div>}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label><i className="fas fa-lock mr-1" style={{ color: '#e74c3c' }}></i>Konfirmasi Password <span className="text-danger">*</span></label>
                                            <input type="password" name="password_confirmation" className={`form-control ${formErrors.password_confirmation ? 'is-invalid' : ''}`}
                                                value={formData.password_confirmation} onChange={handleInputChange} placeholder="Ulangi password" required style={{ borderRadius: '8px' }} />
                                            {formErrors.password_confirmation && <div className="invalid-feedback">{formErrors.password_confirmation}</div>}
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label><i className="fas fa-id-card mr-1" style={{ color: '#9b59b6' }}></i>ID Karyawan <span className="text-danger">*</span></label>
                                            <input type="text" name="employee_id" className={`form-control ${formErrors.employee_id ? 'is-invalid' : ''}`}
                                                value={formData.employee_id} onChange={handleInputChange} placeholder="ID karyawan" required style={{ borderRadius: '8px' }} />
                                            {formErrors.employee_id && <div className="invalid-feedback">{formErrors.employee_id}</div>}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label><i className="fas fa-phone mr-1" style={{ color: '#2ecc71' }}></i>Telepon</label>
                                            <input type="text" name="phone" className="form-control"
                                                value={formData.phone} onChange={handleInputChange} placeholder="Nomor telepon (opsional)" style={{ borderRadius: '8px' }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-map-marker-alt mr-1" style={{ color: '#e74c3c' }}></i>Regional <span className="text-danger">*</span></label>
                                    <select name="regional_id" className={`form-control ${formErrors.regional_id ? 'is-invalid' : ''}`}
                                        value={formData.regional_id} onChange={handleInputChange} required style={{ borderRadius: '8px' }}>
                                        <option value="">-- Pilih Regional --</option>
                                        {regionalList.map(regional => (
                                            <option key={regional.id} value={regional.id}>{regional.province} - {regional.district}</option>
                                        ))}
                                    </select>
                                    {formErrors.regional_id && <div className="invalid-feedback">{formErrors.regional_id}</div>}
                                </div>
                            </div>
                            <div className="modal-footer-custom">
                                <button type="button" className="btn btn-light" onClick={() => setShowCreateModal(false)} disabled={submitting} style={{ borderRadius: '8px' }}>
                                    <i className="fas fa-times mr-2"></i>Batal</button>
                                <button type="submit" className="btn text-white" disabled={submitting} 
                                    style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', border: 'none' }}>
                                    {submitting ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Menyimpan...</>) : (<><i className="fas fa-save mr-2"></i>Simpan Officer</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== EDIT MODAL ==================== */}
            {showEditModal && selectedOfficer && (
                <div className="modal-backdrop-custom" onClick={() => setShowEditModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-warning" style={{ borderRadius: '8px 8px 0 0' }}>
                            <h5 className="modal-title"><i className="fas fa-edit mr-2"></i>Edit Officer</h5>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleUpdateOfficer}>
                            <div className="modal-body-custom">
                                <div className="alert alert-info" style={{ borderRadius: '8px' }}>
                                    <i className="fas fa-info-circle mr-2"></i>Mengedit: <strong>{selectedOfficer.name}</strong> ({selectedOfficer.email})</div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label><i className="fas fa-user mr-1" style={{ color: '#3498db' }}></i>Nama <span className="text-danger">*</span></label>
                                            <input type="text" name="name" className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                                                value={editFormData.name} onChange={handleEditInputChange} required style={{ borderRadius: '8px' }} />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label><i className="fas fa-id-card mr-1" style={{ color: '#9b59b6' }}></i>ID Karyawan <span className="text-danger">*</span></label>
                                            <input type="text" name="employee_id" className={`form-control ${formErrors.employee_id ? 'is-invalid' : ''}`}
                                                value={editFormData.employee_id} onChange={handleEditInputChange} required style={{ borderRadius: '8px' }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label><i className="fas fa-phone mr-1" style={{ color: '#2ecc71' }}></i>Telepon</label>
                                            <input type="text" name="phone" className="form-control"
                                                value={editFormData.phone} onChange={handleEditInputChange} style={{ borderRadius: '8px' }} />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label><i className="fas fa-map-marker-alt mr-1" style={{ color: '#e74c3c' }}></i>Regional <span className="text-danger">*</span></label>
                                            <select name="regional_id" className={`form-control ${formErrors.regional_id ? 'is-invalid' : ''}`}
                                                value={editFormData.regional_id} onChange={handleEditInputChange} required style={{ borderRadius: '8px' }}>
                                                <option value="">-- Pilih Regional --</option>
                                                {regionalList.map(regional => (
                                                    <option key={regional.id} value={regional.id}>{regional.province} - {regional.district}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <div className="custom-control custom-switch">
                                        <input type="checkbox" className="custom-control-input" id="editOfficerIsActive" 
                                            name="is_active" checked={editFormData.is_active} onChange={handleEditInputChange} />
                                        <label className="custom-control-label" htmlFor="editOfficerIsActive" style={{ fontWeight: '600' }}>
                                            <i className={`fas fa-${editFormData.is_active ? 'check-circle text-success' : 'times-circle text-danger'} mr-1`}></i>Status Aktif</label>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer-custom">
                                <button type="button" className="btn btn-light" onClick={() => setShowEditModal(false)} disabled={submitting} style={{ borderRadius: '8px' }}>
                                    <i className="fas fa-times mr-2"></i>Batal</button>
                                <button type="submit" className="btn btn-warning" disabled={submitting} style={{ borderRadius: '8px' }}>
                                    {submitting ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Memperbarui...</>) : (<><i className="fas fa-save mr-2"></i>Perbarui Officer</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== DELETE MODAL ==================== */}
            {showDeleteModal && selectedOfficer && (
                <div className="modal-backdrop-custom" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-danger text-white" style={{ borderRadius: '8px 8px 0 0' }}>
                            <h5 className="modal-title"><i className="fas fa-trash mr-2"></i>Hapus Officer</h5>
                            <button className="close-btn text-white" onClick={() => setShowDeleteModal(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body-custom text-center py-4">
                            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '64px' }}></i>
                            <h5 className="mt-3">Hapus Officer?</h5>
                            <p className="text-muted">Anda akan menghapus <strong>{selectedOfficer.name}</strong>.</p>
                            <p className="text-danger mb-0">Tindakan ini tidak dapat dibatalkan.</p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button className="btn btn-light" onClick={() => setShowDeleteModal(false)} disabled={submitting} style={{ borderRadius: '8px' }}>
                                <i className="fas fa-times mr-2"></i>Batal</button>
                            <button className="btn btn-danger" onClick={handleDeleteOfficer} disabled={submitting} style={{ borderRadius: '8px' }}>
                                {submitting ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Menghapus...</>) : (<><i className="fas fa-trash mr-2"></i>Hapus</>)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== DETAIL MODAL ==================== */}
            {showDetailModal && officerDetail && (
                <div className="modal-backdrop-custom" onClick={() => { setShowDetailModal(false); setOfficerDetail(null); }}>
                    <div className="modal-custom modal-lg-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom text-white" style={{ borderRadius: '8px 8px 0 0', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' }}>
                            <h5 className="modal-title"><i className="fas fa-info-circle mr-2"></i>Detail Officer</h5>
                            <button className="close-btn text-white" onClick={() => { setShowDetailModal(false); setOfficerDetail(null); }}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body-custom">
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card bg-light" style={{ borderRadius: '10px' }}>
                                        <div className="card-body text-center">
                                            <h4 className="fw-bold mb-2">{officerDetail.name}</h4>
                                            <p className="text-muted mb-1">
                                                <i className="fas fa-envelope mr-1"></i>{officerDetail.email || '-'} 
                                                <span className="mx-2">|</span>
                                                <i className="fas fa-id-card mr-1"></i>{officerDetail.employee_id || '-'}
                                            </p>
                                            <p className="text-muted mb-2">
                                                <i className="fas fa-map-marker-alt mr-1"></i>
                                                {officerDetail.regional?.province} - {officerDetail.regional?.district}
                                            </p>
                                            <span className={`badge ${officerDetail.is_active ? 'badge-success' : 'badge-danger'}`} 
                                                style={{ padding: '6px 14px', borderRadius: '20px' }}>
                                                {officerDetail.is_active ? '✅ Aktif' : '❌ Nonaktif'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row mt-3">
                                <div className="col-6"><small className="text-muted">Dibuat: {new Date(officerDetail.created_at).toLocaleString('id-ID')}</small></div>
                                <div className="col-6 text-right"><small className="text-muted">Login terakhir: {officerDetail.last_login ? new Date(officerDetail.last_login).toLocaleString('id-ID') : '-'}</small></div>
                            </div>
                        </div>
                        <div className="modal-footer-custom">
                            <button className="btn btn-secondary" onClick={() => { setShowDetailModal(false); setOfficerDetail(null); }} style={{ borderRadius: '8px' }}>
                                <i className="fas fa-times mr-2"></i>Tutup</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== CUSTOM MODAL STYLES ==================== */}
            <style jsx="true">{`
                .modal-backdrop-custom { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
                .modal-custom { background: white; border-radius: 8px; width: 650px; max-width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
                .modal-lg-custom { width: 750px; }
                .modal-sm-custom { width: 450px; }
                .modal-header-custom { padding: 16px 20px; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center; }
                .modal-body-custom { padding: 20px; }
                .modal-footer-custom { padding: 16px 20px; border-top: 1px solid #dee2e6; display: flex; justify-content: flex-end; gap: 10px; }
                .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; padding: 0; }
                .close-btn:hover { opacity: 0.8; }
                .custom-control-input:checked ~ .custom-control-label::before { background-color: #2ecc71; border-color: #2ecc71; }
            `}</style>
        </MainLayouts>
    );
}