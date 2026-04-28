import React from 'react';
import { Routes, Route, Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, FileText, Wrench, Users, DollarSign, LogOut, Sun, Moon, Bike, UserCog } from 'lucide-react';
import Login from '../pages/Login';
// Placeholders
const Dashboard = () => <div className="card"><h1>Dashboard</h1><p>Welcome to Shine Tech Bikez System</p></div>;
const Customers = () => <div className="card"><h1>Customers</h1></div>;
const Vehicles = () => <div className="card"><h1>Vehicles</h1></div>;
const Finance = () => <div className="card"><h1>Finance</h1></div>;

const Layout = () => {
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(window.innerWidth > 768);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

    React.useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) setIsSidebarOpen(true);
            else setIsSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/jobs', icon: FileText, label: 'Job Cards' },
        { path: '/customers', icon: Users, label: 'Customers' },
        { path: '/vehicles', icon: Bike, label: 'Vehicles' },
        { path: '/staff', icon: UserCog, label: 'Staff' },
        { path: '/vendors', icon: Users, label: 'Vendors' },
        { path: '/finance', icon: DollarSign, label: 'Finance' },
        { path: '/workshop', icon: Wrench, label: 'Workshop' },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="app-container">
            {/* Mobile Sidebar Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 90 }}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`sidebar ${isSidebarOpen ? 'open' : ''}`}
                style={{
                    width: '260px',
                    backgroundColor: 'var(--card)',
                    borderRight: '1px solid var(--border)',
                    position: 'fixed',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    zIndex: 100,
                    transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>Shine Tech Bikez</h2>
                    {isMobile && (
                        <button onClick={() => setIsSidebarOpen(false)} className="btn" style={{ padding: '0.25rem', color: 'var(--secondary)' }}>
                            <LogOut size={20} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                    )}
                </div>

                <nav style={{ flex: 1, padding: '1rem' }}>
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => isMobile && setIsSidebarOpen(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.5rem',
                                marginBottom: '0.5rem',
                                textDecoration: 'none',
                                color: location.pathname === item.path ? 'white' : 'var(--secondary)',
                                backgroundColor: location.pathname === item.path ? 'var(--primary)' : 'transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            <item.icon size={20} />
                            <span style={{ fontWeight: 500 }}>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                    <button onClick={toggleTheme} className="btn" style={{ width: '100%', marginBottom: '0.5rem', justifyContent: 'flex-start', color: 'var(--text)' }}>
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        <span>Toggle Theme</span>
                    </button>
                    <button onClick={logout} className="btn" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content" style={{
                marginLeft: isMobile ? 0 : '260px',
                transition: 'all 0.3s ease-in-out',
                width: isMobile ? '100%' : 'calc(100% - 260px)',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <header style={{
                    marginBottom: '1.5rem',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    padding: isMobile ? '0.5rem 0' : '0'
                }}>
                    {isMobile && (
                        <button
                            onClick={toggleSidebar}
                            className="btn"
                            style={{
                                padding: '0.6rem',
                                border: '1px solid var(--border)',
                                borderRadius: '0.75rem',
                                background: 'var(--card)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}
                        >
                            <LayoutDashboard size={20} color="var(--primary)" />
                        </button>
                    )}
                    <h2 style={{
                        fontSize: isMobile ? '1.25rem' : '1.75rem',
                        fontWeight: 700,
                        color: 'var(--text)',
                        textTransform: 'capitalize'
                    }}>
                        {/*location.pathname === '/' ? 'Overview' : location.pathname.substring(location.pathname.lastIndexOf('/') + 1)*/}
                    </h2>
                </header>
                <div style={{ flex: 1 }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

const LayoutComponent = Layout; // Alias to avoid conflict

const PrivateRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
};

export default LayoutComponent;
