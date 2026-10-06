import React from 'react'
import { Route, Routes } from 'react-router'
import AdminLayout from '../components/layouts/AdminLayout'

function AllRoutes() {
  return (
    <Routes>
        <Route path='/admin' element={<AdminLayout/>}></Route>
    </Routes>
  )
}

export default AllRoutes