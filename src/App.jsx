import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from '@/components/Layout/Layout'

// Trang chính
import Dashboard from '@/pages/Dashboard'

// Quản lý đào tạo
import DepartmentManagement from '@/pages/DepartmentManagement'
import SubjectsManagement from '@/pages/SubjectManagement'
import CohortManagement from '@/pages/CohortManagement'
import MajorManagement from '@/pages/MajorManagement'
import KnowledgeBlockManagement from '@/pages/KnowledgeBlockManagement'
import ProgramManagement from '@/pages/ProgramManagement'
import ProgramDetail from '@/pages/ProgramDetail'
import TuitionCalculator from '@/pages/TuitionCalculator';
import TuitionDetail from '@/pages/TuitionDetail';
import FacultyManagement from '@/pages/FacultyManagement'

// Quản lý nhân sự
import LecturerManagement from '@/pages/LecturerManagement'
import LecturerDetail from '@/pages/LecturerDetail'
import StaffManagement from '@/pages/StaffManagement'
import StaffDetail from '@/pages/StaffDetail'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Bọc Layout và dùng nested routes */}
          <Route path="/" element={<Layout />}>
            {/* Trang chính */}
            <Route index element={<Dashboard />} />

            {/* Quản lý đào tạo */}
            <Route path="majors" element={<MajorManagement />} />
            <Route path="cohort" element={<CohortManagement />} />
            <Route path="subjects" element={<SubjectsManagement />} />
            <Route path="knowledge-blocks" element={<KnowledgeBlockManagement />} />
            <Route path="programs" element={<ProgramManagement />} />
            <Route path="chuong-trinh/:id" element={<ProgramDetail />} />
            <Route path="hoc-phi/:id" element={<TuitionDetail />} />
            <Route path="departments" element={<DepartmentManagement />} />
            <Route path="faculties" element={<FacultyManagement />} />
            <Route path="tuition-calculator" element={<TuitionCalculator />} />

            {/* Quản lý nhân sự */}
            <Route path="lecturers" element={<LecturerManagement />} />
            <Route path="giang-vien/:id" element={<LecturerDetail />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="nhan-vien/:id" element={<StaffDetail />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App
