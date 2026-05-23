import React from 'react'
import {BrowserRouter as Router, Routes, Route} from "react-router-dom"
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './services/ProtectedRoute'
import CreateValidation from './pages/Validation/CreateValidation'
import VacancyList from './pages/Vacancy/VacancyList'
import VacancyDetail from './pages/Vacancy/VacancyDetail'


export default function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Login />}/>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />}/>
        </Route>
      </Routes>
    </Router>
  )
}
