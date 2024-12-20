import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminWrapper from '../components/admin-wrapper/admin-wrapper.jsx';
import Pages from '../pages/pages.js';

const AdminRoutes = () => (
    <Routes>
        <Route path="/" element={<AdminWrapper />}>
            <Route index element={<Pages.Dashboard />} />
            <Route path="pos-users" element={<Pages.POSUsers />} />
            <Route path="inventory" element={<Pages.Inventory />} />
            <Route path="mechanics" element={<Pages.Mechanics />} />
            <Route path="summaries" element={<Pages.Summaries />} />
            <Route path="reports" element={<Pages.Reports />} />
                <Route path="/reports/sales-report" element={<Pages.Reports />} />
                <Route path="/reports/expenses-report" element={<Pages.Reports />} />
                <Route path="/reports/labor-cost-report" element={<Pages.Reports />} />
                <Route path="/reports/order-sales-report" element={<Pages.Reports />} />
                <Route path="/reports/revenue-report" element={<Pages.Reports />} />
            <Route path="receipts" element={<Pages.Receipts />} />
            <Route path="records">
                <Route index element={<Pages.Records />} />
                <Route path=":recordType" element={<Pages.Records />} />
            </Route>
            <Route path="waitlist" element={<Pages.Waitlist />} />
            <Route path="bike-builder-upgrader" element={<Pages.BikeBuilderUpgrader />} />
                <Route path="bike-builder-upgrader/:type" element={<Pages.BikeType />} />
                    <Route path="bike-builder-upgrader/:type/parts/frame" element={<Pages.Frame />} />
                    <Route path="bike-builder-upgrader/:type/parts/fork" element={<Pages.Fork />} />
                    <Route path="bike-builder-upgrader/:type/parts/groupset" element={<Pages.Groupset />} />
                    <Route path="bike-builder-upgrader/:type/parts/wheelset" element={<Pages.Wheelset />} />
                    <Route path="bike-builder-upgrader/:type/parts/seat" element={<Pages.Seat />} />
                    <Route path="bike-builder-upgrader/:type/parts/cockpit" element={<Pages.Cockpit />} />
            <Route path="orders" element={<Pages.Orders />} />
            <Route path="settings" element={<Pages.Profile />} />
        </Route>
        <Route path="*" element={<Pages.NotFound />} />
    </Routes >
);

export default AdminRoutes;