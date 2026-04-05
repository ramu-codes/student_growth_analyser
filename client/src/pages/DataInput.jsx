import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Dashboard.css';

const DataInput = () => {
  const [formData, setFormData] = useState({
    subject: '',
    examType: 'mid',
    score: '',
    maxScore: '100',
    attendancePercentage: '100',
    semester: 'Sem 1',
  });
  
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/data/mark', formData);
      toast.success('Mark added successfully! +Points');
      // Clear entire form instead of just subject/score
      setFormData({
        subject: '',
        examType: 'mid',
        score: '',
        maxScore: '100',
        attendancePercentage: '100',
        semester: 'Sem 1',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add mark');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      toast.warning('Please select a CSV file first.');
      return;
    }

    const formDataFile = new FormData();
    formDataFile.append('file', csvFile);

    setLoading(true);
    try {
      const response = await api.post('/data/upload-csv', formDataFile, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message || 'CSV Uploaded Successfully!');
      setCsvFile(null);
    } catch (error) {
      toast.error('Failed to upload CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Record Your Progress</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Manual Entry */}
        <div className="metric-card">
          <h3>Manual Entry</h3>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="text" name="subject" value={formData.subject} onChange={handleInputChange} 
              className="input-field" placeholder="Subject Name (e.g., DBMS)" required />
            
            <select name="examType" value={formData.examType} onChange={handleInputChange} className="input-field">
              <option value="test">Class Test</option>
              <option value="assignment">Assignment</option>
              <option value="mid">Mid Semester</option>
              <option value="end">End Semester</option>
            </select>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input type="number" name="score" value={formData.score} onChange={handleInputChange} 
                className="input-field" placeholder="Score" required />
              <input type="number" name="maxScore" value={formData.maxScore} onChange={handleInputChange} 
                className="input-field" placeholder="Max Score" required />
            </div>
            
            <input type="number" name="attendancePercentage" value={formData.attendancePercentage} onChange={handleInputChange} 
              className="input-field" placeholder="Attendance %" required />
            <input type="text" name="semester" value={formData.semester} onChange={handleInputChange} 
              className="input-field" placeholder="Semester (e.g., Sem 4)" required />
            
            <button type="submit" className="auth-button" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Submitting...' : '+ Add Mark'}
            </button>
          </form>
        </div>
        
        {/* CSV Upload */}
        <div className="metric-card">
          <h3>Bulk CSV Upload</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Upload a CSV with columns: <code style={{ color: 'var(--accent-gold)' }}>subject, examType, score, maxScore, attendance, semester</code>
          </p>
           
          <form onSubmit={handleCsvUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ 
              padding: '2rem', 
              border: '2px dashed var(--border-medium)', 
              borderRadius: 'var(--radius-md)', 
              textAlign: 'center',
              background: 'var(--bg-primary)',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}>
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => setCsvFile(e.target.files[0])}
                style={{ width: '100%', color: 'var(--text-secondary)' }}
              />
              {csvFile && <p style={{ color: 'var(--success)', marginTop: '0.5rem', fontSize: '0.85rem' }}>✓ {csvFile.name}</p>}
            </div>
            <button type="submit" className="auth-button" disabled={loading || !csvFile}>
              {loading ? 'Uploading...' : '📤 Upload CSV'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DataInput;
