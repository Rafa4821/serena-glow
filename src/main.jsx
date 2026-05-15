import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/globals.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import { initAppCheck } from './firebase/appCheck'

initAppCheck()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
