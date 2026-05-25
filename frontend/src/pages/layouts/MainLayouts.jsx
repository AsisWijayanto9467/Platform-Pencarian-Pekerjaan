import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function MainLayouts({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showLogoutPopup, setShowLogoutPopup] = useState(false);
    
    const [user] = useState(() => {
        try {
            const userData = JSON.parse(localStorage.getItem("user") || "{}");
            const profileData = JSON.parse(localStorage.getItem("profile") || "{}");
            
            return {
                name: userData.name || profileData.name || "User",
                role: userData.role || "society",
                email: userData.email || "",
                profile: profileData
            };
        } catch (error) {
            console.error("Error parsing user data:", error);
            return {
                name: "User",
                role: "society"
            };
        }
    });

    const handleLogout = async () => {
        try {
            const res = await api.post("/auth/logout");
            console.log(res.data.message);
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            localStorage.clear();
            navigate("/");
            setShowLogoutPopup(false);
        }
    };

    const isActive = (path) => {
        if (path === `/${user.role}/dashboard`) {
            return location.pathname === `/${user.role}/dashboard`;
        }
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    // Admin Menu Items
    const adminMenuItems = useMemo(() => [
        {
            title: 'Dashboard',
            icon: 'fas fa-tachometer-alt',
            path: '/admin/dashboard',
            roles: ['admin']
        },
        {
            title: 'Kelola Regional',
            icon: 'fas fa-map-marker-alt',
            path: '/admin/regionals',
            roles: ['admin']
        },
        {
            title: 'Kelola Kategori',
            icon: 'fas fa-tags',
            path: '/admin/job-categories',
            roles: ['admin']
        },
        {
            title: 'Kelola Validator',
            icon: 'fas fa-user-check',
            path: '/admin/validators',
            roles: ['admin']
        },
        {
            title: 'Kelola Officer',
            icon: 'fas fa-user-tie',
            path: '/admin/officers',
            roles: ['admin']
        },
        {
            title: 'Kelola Society',
            icon: 'fas fa-users',
            path: '/admin/societies',
            roles: ['admin']
        },
        {
            title: 'Monitoring Validasi',
            icon: 'fas fa-clipboard-check',
            path: '/admin/validations',
            roles: ['admin']
        },
        {
            title: 'Monitoring Lowongan',
            icon: 'fas fa-briefcase',
            path: '/admin/job-vacancies',
            roles: ['admin']
        },
        {
            title: 'Laporan & Export',
            icon: 'fas fa-file-export',
            path: '/admin/reports',
            roles: ['admin']
        },
        {
            title: 'Log Sistem',
            icon: 'fas fa-history',
            path: '/admin/logs',
            roles: ['admin']
        }
    ], []);

    // Officer Menu Items
    const officerMenuItems = useMemo(() => [
        {
            title: 'Dashboard',
            icon: 'fas fa-tachometer-alt',
            path: '/officer/dashboard',
            roles: ['officer']
        },
        {
            title: 'Profil Saya',
            icon: 'fas fa-user-circle',
            path: '/officer/profile',
            roles: ['officer']
        },
        {
            title: 'Lowongan Saya',
            icon: 'fas fa-briefcase',
            path: '/officer/vacancies',
            roles: ['officer']
        },
        {
            title: 'Lamaran Masuk',
            icon: 'fas fa-file-alt',
            path: '/officer/applications',
            roles: ['officer']
        }
    ], []);

    // Validator Menu Items
    const validatorMenuItems = useMemo(() => [
        {
            title: 'Dashboard',
            icon: 'fas fa-tachometer-alt',
            path: '/validator/dashboard',
            roles: ['validator']
        },
        {
            title: 'Profil Saya',
            icon: 'fas fa-user-circle',
            path: '/validator/profile',
            roles: ['validator']
        },
        {
            title: 'Validasi Tertunda',
            icon: 'fas fa-clock',
            path: '/validator/validations/pending',
            roles: ['validator']
        },
        {
            title: 'Riwayat Validasi',
            icon: 'fas fa-history',
            path: '/validator/validations/history',
            roles: ['validator']
        },
        {
            title: 'Laporan',
            icon: 'fas fa-chart-bar',
            path: '/validator/reports',
            roles: ['validator']
        }
    ], []);

    // Society Menu Items
    const societyMenuItems = useMemo(() => [
        {
            title: 'Dashboard',
            icon: 'fas fa-tachometer-alt',
            path: '/society/dashboard',
            roles: ['society']
        },
        {
            title: 'Profil Saya',
            icon: 'fas fa-user-circle',
            path: '/society/profile',
            roles: ['society']
        },
        {
            title: 'Validasi Saya',
            icon: 'fas fa-clipboard-check',
            path: '/society/validation',
            roles: ['society']
        },
        {
            title: 'Lowongan Kerja',
            icon: 'fas fa-briefcase',
            path: '/society/vacancies',
            roles: ['society']
        },
        {
            title: 'Lamaran Saya',
            icon: 'fas fa-file-alt',
            path: '/society/applications',
            roles: ['society']
        },
        {
            title: 'Notifikasi',
            icon: 'fas fa-bell',
            path: '/society/notifications',
            roles: ['society']
        },
        {
            title: 'Bookmark',
            icon: 'fas fa-bookmark',
            path: '/society/bookmarks',
            roles: ['society']
        },
        {
            title: 'Riwayat',
            icon: 'fas fa-history',
            path: '/society/history',
            roles: ['society']
        }
    ], []);

    // Select menu based on user role
    const menuItems = useMemo(() => {
        switch (user?.role) {
            case 'admin':
                return adminMenuItems;
            case 'officer':
                return officerMenuItems;
            case 'validator':
                return validatorMenuItems;
            case 'society':
                return societyMenuItems;
            default:
                return [];
        }
    }, [user?.role, adminMenuItems, officerMenuItems, validatorMenuItems, societyMenuItems]);

    const filteredMenu = useMemo(() => 
        menuItems.filter(item => item.roles.includes(user?.role)),
        [menuItems, user?.role]
    );

    // Get page title based on current path
    const getPageTitle = () => {
        for (const item of menuItems) {
            if (location.pathname === item.path || location.pathname.startsWith(item.path + '/')) {
                return item.title;
            }
        }
        return 'Dashboard';
    };

    // Get role badge color
    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'admin': return 'badge-danger';
            case 'officer': return 'badge-primary';
            case 'validator': return 'badge-success';
            case 'society': return 'badge-info';
            default: return 'badge-secondary';
        }
    };

    // Get role icon for header badge
    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return 'fa-crown';
            case 'officer': return 'fa-user-tie';
            case 'validator': return 'fa-check-shield';
            case 'society': return 'fa-user';
            default: return 'fa-user';
        }
    };

    // Get role display name
    const getRoleDisplayName = (role) => {
        switch (role) {
            case 'admin': return 'Administrator';
            case 'officer': return 'Officer';
            case 'validator': return 'Validator';
            case 'society': return 'Pencari Kerja';
            default: return role;
        }
    };

    const sidebarWidth = '280px';
    const sidebarCollapsedWidth = '70px';
    const headerHeight = 60;

    return (
        <div className="d-flex" id="wrapper" style={{ minHeight: '100vh' }}>
            {/* Overlay for mobile */}
            {!sidebarCollapsed && (
                <div 
                    className="sidebar-overlay d-md-none"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 999
                    }}
                    onClick={() => setSidebarCollapsed(true)}
                />
            )}

            {/* Sidebar - Fixed */}
            <nav 
                className="bg-dark text-white sidebar"
                style={{
                    height: '100vh',
                    width: sidebarCollapsed ? sidebarCollapsedWidth : sidebarWidth,
                    transition: 'all 0.3s ease',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    zIndex: 1000,
                    boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
                    overflowX: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Sidebar Header */}
                <div className="d-flex align-items-center border-bottom border-secondary flex-shrink-0" 
                     style={{ padding: '14px 18px', height: `${headerHeight}px` }}>
                    {!sidebarCollapsed ? (
                        <div className="d-flex align-items-center w-100">
                            <div className="bg-primary rounded d-flex align-items-center justify-content-center mr-3" 
                                 style={{ width: '38px', height: '38px', minWidth: '38px' }}>
                                <i className="fas fa-briefcase text-white" style={{ fontSize: '18px' }}></i>
                            </div>
                            <div className="flex-grow-1 min-width-0">
                                <h6 className="mb-0 text-white fw-bold text-truncate" style={{ fontSize: '1.1rem' }}>
                                    JobPortal
                                </h6>
                                {user?.role && (
                                    <small className="text-white-50 text-capitalize" style={{ fontSize: '0.7rem' }}>
                                        {getRoleDisplayName(user.role)}
                                    </small>
                                )}
                            </div>
                            <button 
                                className="btn btn-link text-white p-0 ml-2"
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                style={{ textDecoration: 'none' }}
                            >
                                <i className="fas fa-chevron-left" style={{ fontSize: '16px' }}></i>
                            </button>
                        </div>
                    ) : (
                        <button 
                            className="btn btn-link text-white p-0 mx-auto"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            style={{ textDecoration: 'none' }}
                        >
                            <i className="fas fa-bars" style={{ fontSize: '20px' }}></i>
                        </button>
                    )}
                </div>

                {/* User Profile Section */}
                {!sidebarCollapsed && user && (
                    <div className="border-bottom border-secondary flex-shrink-0" style={{ padding: '14px 18px' }}>
                        <div className="d-flex align-items-center gap-3">
                            <div 
                                className="rounded-circle bg-light d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: '42px', height: '42px' }}
                            >
                                <span className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="flex-grow-1 min-width-0">
                                <p className="mb-1 text-white text-truncate" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                                    {user.name || 'User'}
                                </p>
                                <span className={`badge text-capitalize ${getRoleBadgeClass(user.role)}`} 
                                      style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                                    {getRoleDisplayName(user.role)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Menu - Scrollable */}
                <div className="flex-grow-1 overflow-auto" style={{ padding: '12px 8px' }}>
                    {filteredMenu.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            className={`nav-link-custom d-flex align-items-center text-white text-decoration-none rounded mb-1 ${
                                isActive(item.path) ? 'active' : ''
                            }`}
                            style={{
                                padding: sidebarCollapsed ? '14px' : '10px 16px',
                                transition: 'all 0.2s ease',
                                backgroundColor: isActive(item.path) ? 'rgba(13, 110, 253, 0.8)' : 'transparent',
                                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                            title={sidebarCollapsed ? item.title : ''}
                            onMouseEnter={(e) => {
                                if (!isActive(item.path)) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive(item.path)) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            <i className={`${item.icon} ${sidebarCollapsed ? '' : 'mr-3'}`} 
                               style={{ fontSize: '16px', width: sidebarCollapsed ? 'auto' : '20px', textAlign: 'center' }}></i>
                            {!sidebarCollapsed && (
                                <>
                                    <span className="flex-grow-1">{item.title}</span>
                                    {isActive(item.path) && (
                                        <i className="fas fa-chevron-right" style={{ fontSize: '12px' }}></i>
                                    )}
                                </>
                            )}
                        </Link>
                    ))}
                </div>

                {/* Sidebar Footer with Logout */}
                <div className="border-top border-secondary flex-shrink-0" style={{ padding: sidebarCollapsed ? '10px' : '14px 18px' }}>
                    {!sidebarCollapsed ? (
                        <button
                            className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center"
                            onClick={() => setShowLogoutPopup(true)}
                            style={{ 
                                fontSize: '0.9rem',
                                transition: 'all 0.2s',
                                padding: '8px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
                                e.currentTarget.style.borderColor = '#dc3545';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderColor = '#f8f9fa';
                            }}
                        >
                            <i className="fas fa-sign-out-alt mr-2" style={{ fontSize: '16px' }}></i>
                            Logout
                        </button>
                    ) : (
                        <button
                            className="btn btn-link text-white p-0 mx-auto d-flex"
                            onClick={() => setShowLogoutPopup(true)}
                            style={{ textDecoration: 'none' }}
                            title="Logout"
                        >
                            <i className="fas fa-sign-out-alt" style={{ fontSize: '20px' }}></i>
                        </button>
                    )}
                </div>
            </nav>

            {/* Main Content Area */}
            <div 
                className="flex-grow-1 d-flex flex-column"
                style={{
                    marginLeft: sidebarCollapsed ? sidebarCollapsedWidth : sidebarWidth,
                    transition: 'all 0.3s ease',
                    minHeight: '100vh',
                    paddingTop: `${headerHeight}px`
                }}
            >
                {/* Fixed Top Header */}
                <header 
                    className="bg-white border-bottom shadow-sm"
                    style={{ 
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        left: sidebarCollapsed ? sidebarCollapsedWidth : sidebarWidth,
                        zIndex: 998,
                        height: `${headerHeight}px`,
                        transition: 'all 0.3s ease'
                    }}
                >
                    <div className="container-fluid h-100" style={{ padding: '0 24px' }}>
                        <div className="d-flex justify-content-between align-items-center h-100">
                            <div className="d-flex align-items-center">
                                <button 
                                    className="btn btn-light d-md-none mr-3"
                                    onClick={() => setSidebarCollapsed(false)}
                                    style={{ padding: '6px 10px' }}
                                >
                                    <i className="fas fa-bars" style={{ fontSize: '18px' }}></i>
                                </button>
                                <div>
                                    <h6 className="mb-0 text-dark fw-bold" style={{ lineHeight: '1.3', fontSize: '1.1rem' }}>
                                        {getPageTitle()}
                                    </h6>
                                    <small className="text-muted">
                                        Selamat datang, {user?.name || 'User'}
                                    </small>
                                </div>
                            </div>
                            
                            <div className="d-flex align-items-center gap-3">
                                {/* User Role Badge */}
                                <span className={`badge ${getRoleBadgeClass(user.role)} d-none d-md-inline-block text-capitalize`}
                                      style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                                    <i className={`fas ${getRoleIcon(user.role)} mr-1`}></i>
                                    {getRoleDisplayName(user.role)}
                                </span>

                                {/* Notifications Dropdown */}
                                <div className="dropdown">
                                    <button 
                                        className="btn btn-light position-relative"
                                        type="button"
                                        data-toggle="dropdown"
                                        style={{ padding: '8px 12px' }}
                                    >
                                        <i className="fas fa-bell"></i>
                                        <span className="badge badge-danger position-absolute" 
                                              style={{ 
                                                  top: '4px', 
                                                  right: '4px', 
                                                  fontSize: '10px',
                                                  padding: '3px 6px',
                                                  lineHeight: '1'
                                              }}>
                                            3
                                        </span>
                                    </button>
                                    <div className="dropdown-menu dropdown-menu-right shadow" style={{ width: '300px', marginTop: '8px' }}>
                                        <h6 className="dropdown-header">Notifikasi</h6>
                                        <div className="dropdown-divider"></div>
                                        <a className="dropdown-item py-2" href="#">
                                            <i className="fas fa-check-circle text-success mr-2"></i>
                                            Permintaan validasi baru
                                        </a>
                                        <a className="dropdown-item py-2" href="#">
                                            <i className="fas fa-file-alt text-primary mr-2"></i>
                                            Status lamaran diperbarui
                                        </a>
                                        <a className="dropdown-item py-2" href="#">
                                            <i className="fas fa-exclamation-triangle text-warning mr-2"></i>
                                            Persetujuan tertunda
                                        </a>
                                    </div>
                                </div>

                                {/* User Button */}
                                <button 
                                    className="btn btn-light d-flex align-items-center"
                                    style={{ padding: '8px 14px' }}
                                >
                                    <div 
                                        className="rounded-circle bg-primary d-flex align-items-center justify-content-center mr-2"
                                        style={{ width: '32px', height: '32px' }}
                                    >
                                        <span className="text-white" style={{ fontWeight: 'bold' }}>
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <span className="d-none d-md-inline">
                                        {user?.name || 'User'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Page Content */}
                <main className="flex-grow-1" style={{ backgroundColor: '#f5f5f5', padding: '24px' }}>
                    {children}
                </main>

                {/* Footer */}
                <footer className="bg-white border-top" style={{ padding: '14px 24px' }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted" style={{ fontSize: '0.9rem' }}>
                            &copy; 2026 JobPortal - Sistem Pencari Kerja
                        </small>
                        <small className="text-muted" style={{ fontSize: '0.9rem' }}>
                            <i className="fas fa-shield-alt mr-1"></i>
                            Sistem Terproteksi
                        </small>
                    </div>
                </footer>
            </div>

            {/* Logout Confirmation Popup */}
            {showLogoutPopup && (
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
                    onClick={() => setShowLogoutPopup(false)}
                >
                    <div 
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '10px',
                            padding: '32px',
                            width: '420px',
                            maxWidth: '100%',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                            textAlign: 'center'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ marginBottom: '20px' }}>
                            <i className="fas fa-sign-out-alt"
                               style={{ 
                                   fontSize: '48px', 
                                   color: '#dc3545',
                                   backgroundColor: '#f8d7da',
                                   padding: '16px',
                                   borderRadius: '50%'
                               }} 
                            />
                        </div>
                        
                        <h5 style={{ marginBottom: '12px', fontWeight: 'bold', color: '#333', fontSize: '1.25rem' }}>
                            Konfirmasi Logout
                        </h5>
                        
                        <p style={{ color: '#666', marginBottom: '6px', fontSize: '1rem' }}>
                            Apakah Anda yakin ingin keluar?
                        </p>
                        <small style={{ color: '#999', display: 'block', marginBottom: '24px', fontSize: '0.9rem' }}>
                            Anda akan diarahkan ke halaman login
                        </small>
                        
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowLogoutPopup(false)}
                                className="btn btn-light"
                                style={{
                                    padding: '10px 24px',
                                    fontSize: '0.95rem',
                                    minWidth: '110px'
                                }}
                            >
                                <i className="fas fa-times mr-2"></i>
                                Batal
                            </button>
                            <button
                                onClick={handleLogout}
                                className="btn btn-danger"
                                style={{
                                    padding: '10px 24px',
                                    fontSize: '0.95rem',
                                    minWidth: '110px'
                                }}
                            >
                                <i className="fas fa-check mr-2"></i>
                                Ya, Keluar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Additional Styles */}
            <style jsx="true">{`
                .nav-link-custom {
                    color: rgba(255,255,255,0.7) !important;
                    border-left: 3px solid transparent;
                }
                
                .nav-link-custom:hover {
                    color: #fff !important;
                }
                
                .nav-link-custom.active {
                    color: #fff !important;
                    border-left-color: #0d6efd;
                }
                
                #wrapper {
                    min-height: 100vh;
                }
                
                .sidebar-overlay {
                    display: none;
                }
                
                @media (max-width: 768px) {
                    .sidebar-overlay {
                        display: block;
                    }
                    
                    .sidebar {
                        transform: translateX(-100%);
                    }
                    
                    .sidebar:not(.collapsed) {
                        transform: translateX(0);
                    }
                }
                
                @media (min-width: 769px) {
                    .sidebar-overlay {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}