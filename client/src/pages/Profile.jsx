 import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Profile.css';
import { FaTrash } from 'react-icons/fa';

const Profile = () => {
  // --- Main profile state ---
  const [profile, setProfile] = useState({
    studentId: '',
    currentYear: 1,
    branch: '',
    attendancePercentage: 0,
    githubUsername: '',
    leetcodeUsername: '',
    linkedinProfile: '',
  });

  // --- GPA History State ---
  const [gpaHistory, setGpaHistory] = useState([]);
  const [gpaForm, setGpaForm] = useState({ semester: '', gpa: '' });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Fetch profile data on component load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/profile/me');
        // Set main profile data
        setProfile({
          studentId: data.studentId || '',
          currentYear: data.currentYear || 1,
          branch: data.branch || '',
          attendancePercentage: data.attendancePercentage || 0,
          githubUsername: data.githubUsername || '',
          leetcodeUsername: data.leetcodeUsername || '',
          linkedinProfile: data.linkedinProfile || '',
        });
        // Set GPA history (array of {semester, gpa})
        setGpaHistory(data.gpaHistory || []);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch profile', error);
        setMessage('Failed to load profile');
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle input changes for main profile fields
  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  // --- GPA sub-form logic ---
  const handleGpaFormChange = (e) => {
    setGpaForm({ ...gpaForm, [e.target.name]: e.target.value });
  };

  const handleAddGpa = (e) => {
    e.preventDefault();
    if (!gpaForm.semester || !gpaForm.gpa) return;
    setGpaHistory([...gpaHistory, { ...gpaForm, _id: Date.now() }]);
    setGpaForm({ semester: '', gpa: '' });
  };

  const handleRemoveGpa = (id) => {
    setGpaHistory(gpaHistory.filter((item) => item._id !== id));
  };

  // Submit updated profile to server
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const payload = {
        ...profile,
        gpaHistory: gpaHistory.map(({ semester, gpa }) => ({ semester, gpa })), // clean IDs
      };

      const { data } = await api.put('/profile/me', payload);
      setProfile({
        studentId: data.studentId || '',
        currentYear: data.currentYear || 1,
        branch: data.branch || '',
        attendancePercentage: data.attendancePercentage || 0,
        githubUsername: data.githubUsername || '',
        leetcodeUsername: data.leetcodeUsername || '',
        linkedinProfile: data.linkedinProfile || '',
      });
      setGpaHistory(data.gpaHistory || []);
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile', error);
      setMessage(error.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="profile-container">
      <h2>Manage Your Profile</h2>
      <p>This is your static data. Keep it updated for accurate analysis.</p>
      {message && <p className="message">{message}</p>}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Student ID</label>
          <input
            type="text"
            name="studentId"
            value={profile.studentId}
            onChange={handleChange}
            placeholder="Your university ID"
          />
        </div>
        <div className="form-group">
          <label>Current Year (B.Tech)</label>
          <input
            type="number"
            name="currentYear"
            value={profile.currentYear}
            onChange={handleChange}
            min="1"
            max="5"
          />
        </div>
        <div className="form-group">
          <label>Branch</label>
          <input
            type="text"
            name="branch"
            value={profile.branch}
            onChange={handleChange}
            placeholder="e.g., Computer Science"
          />
        </div>
        <div className="form-group">
          <label>Attendance (%)</label>
          <input
            type="number"
            name="attendancePercentage"
            value={profile.attendancePercentage}
            onChange={handleChange}
            min="0"
            max="100"
          />
        </div>
        <div className="form-group">
          <label>GitHub Username</label>
          <input
            type="text"
            name="githubUsername"
            value={profile.githubUsername}
            onChange={handleChange}
            placeholder="github_username"
          />
        </div>
        <div className="form-group">
          <label>LeetCode Username</label>
          <input
            type="text"
            name="leetcodeUsername"
            value={profile.leetcodeUsername}
            onChange={handleChange}
            placeholder="leetcode_username"
          />
        </div>
        <div className="form-group">
          <label>LinkedIn Profile URL</label>
          <input
            type="text"
            name="linkedinProfile"
            value={profile.linkedinProfile}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        <button type="submit" className="auth-button">
          Save All Changes
        </button>
      </form>

      {/* GPA History Section */}
      <div className="gpa-history-section">
        <h3>GPA History</h3>
        <p>Your “GPA Trend” chart is powered by this data. Keep it updated.</p>

        {/* Existing GPA Records */}
        <table className="data-table">
          <thead>
            <tr>
              <th>Semester</th>
              <th>GPA</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {gpaHistory.map((item) => (
              <tr key={item._id}>
                <td>{item.semester}</td>
                <td>{item.gpa}</td>
                <td>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleRemoveGpa(item._id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {gpaHistory.length === 0 && (
              <tr>
                <td colSpan="3">No GPA data added yet.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Add New GPA Form */}
        <form onSubmit={handleAddGpa} className="gpa-form">
          <input
            type="text"
            name="semester"
            value={gpaForm.semester}
            onChange={handleGpaFormChange}
            placeholder="e.g., Sem 1"
          />
          <input
            type="number"
            name="gpa"
            value={gpaForm.gpa}
            onChange={handleGpaFormChange}
            placeholder="e.g., 8.5"
            step="0.01"
            min="0"
            max="10"
          />
          <button type="submit" className="auth-button">
            Add
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
