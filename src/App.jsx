import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import InvoicePrint from './pages/InvoicePrint';
import JobCardPage from './pages/JobCardPage';
import Dashboard from './pages/Dashboard';
import JobCards from './pages/JobCards';
import NewJob from './pages/NewJob';
import JobEstimation from './pages/JobEstimation';
import Customers from './pages/Customers';
import Staff from './pages/Staff';
import Finance from './pages/Finance';
import Vendors from './pages/Vendors';
import Workshop from './pages/Workshop';

const PrivateRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/print/invoice/:id" element={<InvoicePrint />} />
            <Route path="/print/proforma/:id" element={<InvoicePrint />} />
            <Route path="/print/jobcard/:id" element={<JobCardPage />} />

            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="jobs" element={<JobCards />} />
                <Route path="jobs/new" element={<NewJob />} />
                <Route path="jobs/:id/estimation" element={<JobEstimation />} />
                <Route path="customers" element={<Customers />} />
                <Route path="vehicles" element={<div className="card"><h2>Vehicles Module</h2><p>Coming Soon</p></div>} />
                <Route path="staff" element={<Staff />} />
                <Route path="vendors" element={<Vendors />} />
                <Route path="finance" element={<Finance />} />
                <Route path="workshop" element={<Workshop />} />
            </Route>
        </Routes>
    );
}
export default App;
