import React, { useState, useCallback, useMemo } from 'react'
import Papa from 'papaparse'
import './App.css'
import { parsePhoneCSV, detectPhoneCSV } from './utils/phoneParser'
import { normalizeJiraRows, detectJiraCSV, filterJiraByMonth, aggregateJiraRows } from './utils/jiraParser'
import { samplePhoneData, sampleMarchJiraRows, seedSampleHistory } from './utils/sampleData'
import { loadHistory, saveMonthToHistory, deleteFromHistory, formatPeriodLabel, currentPeriod } from './utils/historyStorage'
import FileUploadZone from './components/FileUploadZone'
import PhoneDashboard from './components/PhoneDashboard'
import JiraDashboard from './components/JiraDashboard'
import WorkloadDashboard from './components/WorkloadDashboard'
import MonthComparison from './components/MonthComparison'

export default function App() {
  const [phoneData, setPhoneData] = useState(null)
  const [phoneFileName, setPhoneFileName] = useState('')
  const [jiraRawRows, setJiraRawRows] = useState(null)   // normalized, unfiltered
  const [jiraFileName, setJiraFileName] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod)
  const [history, setHistory] = useState(loadHistory)
  const [compareWith, setCompareWith] = useState(null)
  const [activeTab, setActiveTab] = useState('phone')
  const [uploadError, setUploadError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Jira data filtered to selected period
  const jiraData = useMemo(() => {
    if (!jiraRawRows) return null
    const [y, m] = selectedPeriod.split('-').map(Number)
    const filtered = filterJiraByMonth(jiraRawRows, y, m)
    return aggregateJiraRows(filtered)
  }, [jiraRawRows, selectedPeriod])

  // Comparison data from history
  const compareEntry = compareWith ? history[compareWith] : null
  const compareJiraData = useMemo(() => {
    if (!compareEntry?.jiraRawRows) return null
    const [y, m] = compareWith.split('-').map(Number)
    return aggregateJiraRows(filterJiraByMonth(compareEntry.jiraRawRows, y, m))
  }, [compareEntry, compareWith])

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
      const rows = normalizeJiraRows(parsedData)
      setJiraRawRows(rows)
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
    seedSampleHistory()
    setHistory(loadHistory())
    setPhoneData(samplePhoneData)
    setPhoneFileName('sample-phone-march-2026.csv')
    setJiraRawRows(sampleMarchJiraRows)
    setJiraFileName('sample-jira-march-2026.csv')
    setSelectedPeriod('2026-03')
    setActiveTab('phone')
    setUploadError('')
  }

  const handleClearAll = () => {
    setPhoneData(null)
    setPhoneFileName('')
    setJiraRawRows(null)
    setJiraFileName('')
    setActiveTab('phone')
    setUploadError('')
    setCompareWith(null)
  }

  const handleSaveToHistory = () => {
    const ok = saveMonthToHistory(selectedPeriod, phoneData, jiraRawRows)
    if (ok) {
      setHistory(loadHistory())
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    }
  }

  const handleLoadFromHistory = (period) => {
    const entry = history[period]
    if (!entry) return
    if (entry.phoneData) {
      setPhoneData(entry.phoneData)
      setPhoneFileName(`history-${period}`)
    }
    if (entry.jiraRawRows) {
      setJiraRawRows(entry.jiraRawRows)
      setJiraFileName(`history-${period}`)
    }
    setSelectedPeriod(period)
    setActiveTab('phone')
    setCompareWith(null)
  }

  const handleDeleteFromHistory = (period, e) => {
    e.stopPropagation()
    deleteFromHistory(period)
    const updated = loadHistory()
    setHistory(updated)
    if (compareWith === period) setCompareWith(null)
  }

  const historyPeriods = Object.keys(history).sort().reverse()
  const hasData = !!(phoneData || jiraRawRows)

  const availableTabs = []
  if (phoneData) availableTabs.push('phone')
  if (jiraData) availableTabs.push('jira')
  if (phoneData && jiraData) availableTabs.push('workload')
  if (hasData && compareWith && compareEntry) availableTabs.push('compare')

  const currentTab = availableTabs.includes(activeTab) ? activeTab : (availableTabs[0] || 'phone')

  const jiraRowCount = jiraData?.normalizedRows?.length ?? 0

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="icon">📊</span>
          <span>
            IT Support Workload Dashboard
            <div className="header-subtitle">Upload phone records and Jira exports to analyse team workload</div>
          </span>
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }} onClick={handleLoadSample}>
            ⚡ Load Sample Data
          </button>
          {hasData && (
            <button className="btn btn-ghost" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }} onClick={handleClearAll}>
              ✕ Clear
            </button>
          )}
        </div>
      </header>

      <main className="app-main">

        {/* Upload Section */}
        <div className="upload-section">
          <div className="upload-section-header">
            <h2>📁 Upload Data Files</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="period-selector">
                <label className="period-label" htmlFor="period-input">Data period:</label>
                <input
                  id="period-input"
                  type="month"
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(e.target.value)}
                  className="period-input"
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Jira filtered to this month</span>
              </div>
              {hasData && (
                <button
                  className={`btn btn-outline ${saveSuccess ? 'btn-success' : ''}`}
                  onClick={handleSaveToHistory}
                  title={`Save current data as ${formatPeriodLabel(selectedPeriod)}`}
                >
                  {saveSuccess ? '✓ Saved!' : `💾 Save ${formatPeriodLabel(selectedPeriod)}`}
                </button>
              )}
            </div>
          </div>

          <div className="upload-zones">
            <FileUploadZone
              label="Phone Records"
              description="CSV with call metrics per agent (total calls, answered, missed, duration)"
              onFileLoaded={handleFileLoaded}
              loaded={!!phoneData}
              fileName={phoneFileName}
            />
            <FileUploadZone
              label="Jira Export"
              description="Jira CSV export with ticket data (assignee, status, priority, created, resolved)"
              onFileLoaded={handleFileLoaded}
              loaded={!!jiraRawRows}
              fileName={jiraFileName}
            />
          </div>

          {uploadError && (
            <div className="error-banner"><span>⚠️</span>{uploadError}</div>
          )}
        </div>

        {/* History Panel */}
        {historyPeriods.length > 0 && (
          <div className="history-panel">
            <div className="history-header">
              <span className="history-title">🗂️ Saved History</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click to load · stored in browser</span>
            </div>
            <div className="history-list">
              {historyPeriods.map(period => {
                const entry = history[period]
                const isActive = period === selectedPeriod
                const isCompare = period === compareWith
                return (
                  <div key={period} className={`history-item ${isActive ? 'active' : ''} ${isCompare ? 'comparing' : ''}`}>
                    <button className="history-load-btn" onClick={() => handleLoadFromHistory(period)}>
                      <span className="history-period-name">{formatPeriodLabel(period)}</span>
                      <span className="history-meta">
                        {entry.phoneData && '📞'}
                        {entry.jiraRawRows && '🎫'}
                        {isActive && <span className="history-tag current">loaded</span>}
                        {isCompare && <span className="history-tag compare">comparing</span>}
                      </span>
                    </button>
                    <div className="history-actions">
                      {hasData && period !== selectedPeriod && (
                        <button
                          className={`btn-compare ${isCompare ? 'active' : ''}`}
                          onClick={() => setCompareWith(isCompare ? null : period)}
                          title="Compare with current"
                        >
                          {isCompare ? '✓ comparing' : '⚖ compare'}
                        </button>
                      )}
                      <button className="btn-delete-history" onClick={e => handleDeleteFromHistory(period, e)} title="Delete">✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        {hasData && (
          <div className="tab-nav">
            {phoneData && (
              <button className={`tab-btn ${currentTab === 'phone' ? 'active' : ''}`} onClick={() => setActiveTab('phone')}>
                📞 Phone Data
                <span className="badge">{phoneData.length}</span>
              </button>
            )}
            {jiraData && (
              <button className={`tab-btn ${currentTab === 'jira' ? 'active' : ''}`} onClick={() => setActiveTab('jira')}>
                🎫 Jira Data
                <span className="badge">{jiraRowCount}</span>
              </button>
            )}
            {phoneData && jiraData && (
              <button className={`tab-btn ${currentTab === 'workload' ? 'active' : ''}`} onClick={() => setActiveTab('workload')}>
                ⚖️ Workload
              </button>
            )}
            {hasData && compareWith && compareEntry && (
              <button className={`tab-btn ${currentTab === 'compare' ? 'active' : ''}`} onClick={() => setActiveTab('compare')}>
                📅 Compare
                <span className="badge" style={{ background: '#f3f4f6', color: 'var(--text-secondary)' }}>
                  {formatPeriodLabel(compareWith).split(' ')[0]}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasData && (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <h3>No Data Loaded</h3>
            <p>Upload a phone records CSV and/or a Jira export CSV to get started, or click "Load Sample Data" for a demo.</p>
          </div>
        )}

        {/* Dashboard Content */}
        {currentTab === 'phone' && phoneData && (
          <PhoneDashboard data={phoneData} fileName={phoneFileName} />
        )}
        {currentTab === 'jira' && jiraData && (
          <JiraDashboard data={jiraData} fileName={jiraFileName} />
        )}
        {currentTab === 'workload' && phoneData && jiraData && (
          <WorkloadDashboard phoneData={phoneData} jiraData={jiraData} />
        )}
        {currentTab === 'compare' && compareWith && compareEntry && (
          <MonthComparison
            currentPeriod={selectedPeriod}
            currentPhone={phoneData}
            currentJira={jiraData}
            comparePeriod={compareWith}
            comparePhone={compareEntry.phoneData}
            compareJira={compareJiraData}
          />
        )}
      </main>
    </div>
  )
}
