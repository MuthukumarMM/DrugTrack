import React from 'react'
import ReactDOM from 'react-dom/client'
import './drugtrack.css'
import App from './DrugTrackApp.jsx'
import { AuthProvider } from './context/AuthContext'
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><AuthProvider><App /></AuthProvider></React.StrictMode>)
