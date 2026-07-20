import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ArticleRoute from './pages/ArticleRoute'
import HomePage from './pages/HomePage'
import StaticPageRoute from './pages/StaticPageRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/article/:slug" element={<ArticleRoute />} />
        <Route path="/:slug" element={<StaticPageRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  )
}
