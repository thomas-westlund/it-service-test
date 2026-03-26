import React, { useState, useCallback } from 'react'
import Papa from 'papaparse'
import './App.css'
import { parsePhoneCSV, detectPhoneCSV } from './utils/phoneParser'
import { parseJiraCSV, detectJiraCSV } from './utils/jiraParser'
import { samplePhoneData, sampleJiraData } from './utils/sampleData'
import FileUploadZone from './components/FileUploadZone'
import PhoneDashboard from './components/PhoneDashboard'
import JiraDashboard from './components/JiraDashboard'
import WorkloadDashboard from './components/WorkloadDashboard'

export default function App() {
  const [phoneData, setPhoneData] = useState(null)
  const [phoneFileName, setPhoneFileName] = useState('')
  const [jiraData, setJiraData] = useState(null)
  const [jiraFileName, setJiraFileName] = useState('')
  const [activeTab, setActiveTab] = useState('phone')
  const [uploadError, setUploadError] = useState('')

  const handleFileLoaded = useCallback((parsedData, fileName) => {
    setUploadError('')
    if (!parsedData || parsedData.length === 0) {
      setUploadError('The uploaded file appears to be empty or could not be parsed.')
      return
    }

    const headers = Object.keys(parsedData[0])

    const isPhone = detectPhoneCSV(headers)
    const isJira = detectJiraCSV(headers)

    if (isJira && !isPhone) {
      const result = parseJiraCSV(parsedData)
      setJiraData(result)
      setJiraFileName(fileName)
      setActiveTab('jira')
    } else if (isPhone) {
      const result = parsePhoneCSV(parsedData)
      setPhoneData(result)
      setPhoneFileName(fileName)
      setActiveTab('phone')
    } else {
      setUploadError(`Could not detect file type for "${fileName}". Make sure it's a phone records or Jira export CSV.`)
    }
  }, [])

  const handleLoadSample = () => {
    setPhoneData(samplePhoneData)
    setPhoneFileName('sample-phone-data.csv')
    setJiraData(sampleJiraData)
    setJiraFileName('sample-jira-export.csv')
    setActiveTab('phone')
    setUploadError('')
  }

  const handleClearAll = () => {
    setPhoneData(null)
    setPhoneFileName('')
    setJiraData(null)
    setJiraFileName('')
    setActiveTab('phone')
    setUploadError('')
  }

  const availableTabs = []
  if (phoneData) availableTabs.push('phone')
  if (jiraData) availableTabs.push('jira')
  if (phoneData && jiraData) availableTabs.push('workload')

  const currentTab = availableTabs.includes(activeTab) ? activeTab : (availableTabs[0] || 'phone')

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="icon">📊</span>
          <span>
            IT Support Workload Dashboard
            <div className="header-subtitle">Upload phone records and Jira exports to analyse agent workload</div>
          </span>
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }} onClick={handleLoadSample}>
            ⚡ Load Sample Data
          </button>
          {(phoneData || jiraData) && (
            <button className="btn btn-ghost" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }} onClick={handleClearAll}>
              ✕ Clear All
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {/* Upload Section */}
        <div className="upload-section">
          <div className="upload-section-header">
            <h2>📁 Upload Data Files</h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>CSV format supported • Auto-detection enabled</span>
          </div>
          <div className="upload-zones">
            <FileUploadZone
              label="Phone Records"
              description="Upload a CSV with call metrics per agent (total calls, answered, missed, duration)"
              onFileLoaded={handleFileLoaded}
              loaded={!!phoneData}
              fileName={phoneFileName}
            />
            <FileUploadZone
              label="Jira Export"
              description="Upload a Jira CSV export with ticket data (assignee, status, priority, type)"
              onFileLoaded={handleFileLoaded}
              loaded={!!jiraData}
              fileName={jiraFileName}
            />
          </div>
          {uploadError && (
            <div className="error-banner">
              <span>⚠️</span>
              {uploadError}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        {(phoneData || jiraData) && (
          <div className="tab-nav">
            {phoneData && (
              <button
                className={`tab-btn ${currentTab === 'phone' ? 'active' : ''}`}
                onClick={() => setActiveTab('phone')}
              >
                📞 Phone Data
                <span className="badge">{phoneData.length}</span>
              </button>
            )}
            {jiraData && (
              <button
                className={`tab-btn ${currentTab === 'jira' ? 'active' : ''}`}
                onClick={() => setActiveTab('jira')}
              >
                🎫 Jira Data
                <span className="badge">{jiraData.normalizedRows?.length || 0}</span>
              </button>
            )}
            {phoneData && jiraData && (
              <button
                className={`tab-btn ${currentTab === 'workload' ? 'active' : ''}`}
                onClick={() => setActiveTab('workload')}
              >
                ⚖️ Combined Workload
                <span className="badge">NEW</span>
              </button>
            )}
          </div>
        )}

        {/* Dashboard Content */}
        {!phoneData && !jiraData && (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <h3>No Data Loaded</h3>
            <p>Upload a phone records CSV and/or a Jira export CSV above to get started, or click "Load Sample Data" to see a demo.</p>
          </div>
        )}

        {currentTab === 'phone' && phoneData && (
          <PhoneDashboard data={phoneData} fileName={phoneFileName} />
        )}
        {currentTab === 'jira' && jiraData && (
          <JiraDashboard data={jiraData} fileName={jiraFileName} />
        )}
        {currentTab === 'workload' && phoneData && jiraData && (
          <WorkloadDashboard phoneData={phoneData} jiraData={jiraData} />
        )}
      </main>
    </div>
  )
}
