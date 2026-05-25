import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Auth/Login";
import ProtectedRoute from "./services/ProtectedRoute";
import Dashboard from "./pages/User/Dashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import OfficerDashboard from "./pages/Officer/OfficerDashboard";
import ValidatorDashboard from "./pages/Validator/ValidatorDashboard";
import Register from "./pages/Auth/Register";
import RegionalManagement from "./pages/Admin/Regional/RegionalManagement";
import JobCategoryManagement from "./pages/Admin/JobCategory/JobCategoryManagement";
import ValidationManagement from "./pages/Admin/Validation/ValidationManagement";
import OfficerManagement from "./pages/Admin/Officer/OfficerManagement";
import SocietyManagement from "./pages/Admin/SocietyManagement/SocietyManagement";
import JobVacancyManagement from "./pages/Admin/JobVacancy/JobVacancyManagement";
import AdminReport from "./pages/Admin/Report/AdminReport";
import Logs from "./pages/Admin/Logs";
import ValidatorManagement from "./pages/Admin/Validator/ValidatorManagement";
import ValidatorProfile from "./pages/Validator/Profile/ValidatorProfile";
import PendingValidation from "./pages/Validator/Validation/PendingValidation";
import HistoryValidation from "./pages/Validator/Validation/HistoryValidation";
import ValidatorReport from "./pages/Validator/Report/ValidatorReport";
import OfficerProfile from "./pages/Officer/Profile/OfficerProfile";
import OfficerVacancies from "./pages/Officer/Vacancy/OfficerVacancies";
import OfficerApplication from "./pages/Officer/Application/OfficerApplication";
import SocietyProfile from "./pages/User/Profile/SocietyProfile";
import SocietyValidation from "./pages/User/Validation/SocietyValidation";
import SocietyApplication from "./pages/User/Application/SocietyApplication";
import SocietyHistory from "./pages/User/History/SocietyHistory";
import SocietyJobVacancies from "./pages/User/JobVacancy/SocietyJobVacancies";
import Bookmark from "./pages/User/Bookmark/Bookmark";
import Notification from "./pages/User/Notification/Notification";

export default function App() {
  return (
    <Router>
      <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute allowedRoles={['society']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<SocietyProfile />} />
            <Route path="/validation" element={<SocietyValidation />} />
            <Route path="/job-vacancies" element={<SocietyJobVacancies />} />
            <Route path="/application" element={<SocietyApplication />} />
            <Route path="/history" element={<SocietyHistory />} />
            <Route path="/bookmarks" element={<Bookmark />} />
            <Route path="/notifications" element={<Notification />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/regionals" element={<RegionalManagement />} />
            <Route path="/admin/job-categories" element={<JobCategoryManagement/>} />
            <Route path="/admin/validators" element={<ValidatorManagement />} />
            <Route path="/admin/officers" element={<OfficerManagement />} />
            <Route path="/admin/societies" element={<SocietyManagement />} />
            <Route path="/admin/validations" element={<ValidationManagement />} />
            <Route path="/admin/job-vacancies" element={<JobVacancyManagement />} />
            <Route path="/admin/reports" element={<AdminReport />} />
            <Route path="/admin/logs" element={<Logs />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['officer']} />}>
            <Route path="/officer/dashboard" element={<OfficerDashboard />} />
            <Route path="/officer/profile" element={<OfficerProfile />} />
            <Route path="/officer/vacancies" element={<OfficerVacancies />} />
            <Route path="/officer/applications" element={<OfficerApplication />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['validator']} />}>
            <Route path="/validator/dashboard" element={<ValidatorDashboard />} />
            <Route path="/validator/profile" element={<ValidatorProfile />} />
            <Route path="/validator/validations/pending" element={<PendingValidation/>} />
            <Route path="/validator/validations/history" element={<HistoryValidation />} />
            <Route path="/validator/reports" element={<ValidatorReport />} />
          </Route>

      </Routes>
    </Router>
  );
}
