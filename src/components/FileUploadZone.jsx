import React, { useRef, useState, useCallback } from 'react'
import Papa from 'papaparse'
import './FileUploadZone.css'

export default function FileUploadZone({
  label,
  description,
  onFileLoaded,
  accept = '.csv',
  loaded = false,
  fileName = '',
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const processFile = useCallback((file) => {
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        onFileLoaded(results.data, file.name)
      },
      error: (err) => {
        console.error('Parse error:', err)
        onFileLoaded(null, file.name)
      },
    })
  }, [onFileLoaded])

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Reset input so same file can be re-uploaded
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => {
    setDragging(false)
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div
      className={`file-upload-zone ${dragging ? 'dragging' : ''} ${loaded ? 'loaded' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Upload ${label} file`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      />

      {loaded ? (
        <>
          <div className="upload-loaded">
            <div className="upload-checkmark">✓</div>
            <div className="upload-file-info">
              <div className="upload-file-name">{fileName}</div>
              <div className="upload-file-status">File loaded successfully</div>
            </div>
          </div>
          <div className="upload-replace-hint">Click or drag to replace</div>
        </>
      ) : (
        <>
          <span className="upload-icon">
            {label === 'Phone Records' ? '📞' : '🎫'}
          </span>
          <div className="upload-label">{label}</div>
          <div className="upload-description">{description}</div>
          <div className="upload-hint">
            <span>Click to browse</span> or drag and drop your CSV file here
          </div>
        </>
      )}
    </div>
  )
}
