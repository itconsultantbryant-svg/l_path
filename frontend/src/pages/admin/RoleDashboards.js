import AdminDashboard from './Dashboard';

/** Role-specific dashboard wrappers (shared data, role-aware UI inside Dashboard). */
const HopDashboard = () => <AdminDashboard dashboardTitle="Operations Dashboard" />;
const HomDashboard = () => <AdminDashboard dashboardTitle="Marketing Dashboard" />;
const FinanceDashboard = () => <AdminDashboard dashboardTitle="Finance Dashboard" />;
const CsmDashboard = () => <AdminDashboard dashboardTitle="Customer Service Dashboard" />;

export { HopDashboard, HomDashboard, FinanceDashboard, CsmDashboard };
