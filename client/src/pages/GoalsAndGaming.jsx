import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import './Dashboard.css';

const GoalsAndGaming = () => {
  const [data, setData] = useState({ goals: [], gamification: null });
  const [loading, setLoading] = useState(true);
  
  // Tab state for Goal Type
  const [goalType, setGoalType] = useState('academic');

  // Form states mapping
  const [academicGoal, setAcademicGoal] = useState({ title: '', targetPercentage: '', deadline: '' });
  const [projectGoal, setProjectGoal] = useState({ title: '', description: '', techStack: '', deadline: '' });
  const [codingGoal, setCodingGoal] = useState({ title: '', username: '', targetProblems: '', targetDays: '' });

  const fetchGoals = async () => {
    try {
      const response = await api.get('/goals');
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      let payload = { type: goalType };
      
      if (goalType === 'academic') {
        payload = { ...payload, ...academicGoal };
      } else if (goalType === 'project') {
        payload = { 
          ...payload, 
          title: projectGoal.title, 
          deadline: projectGoal.deadline,
          projectDetails: {
            description: projectGoal.description,
            techStack: projectGoal.techStack.split(',').map(s => s.trim())
          }
        };
      } else if (goalType === 'coding') {
        // Build 100 days of streak logic, or equivalent
        payload = {
          ...payload,
          title: codingGoal.title,
          codingDetails: {
            platform: 'leetcode',
            username: codingGoal.username,
            targetProblems: Number(codingGoal.targetProblems),
            targetDays: Number(codingGoal.targetDays)
          }
        };
      }

      await api.post('/goals', payload);
      toast.success(goalType === 'coding' ? 'LeetCode Tracker Started!' : 'Goal Set!');
      
      setAcademicGoal({ title: '', targetPercentage: '', deadline: '' });
      setProjectGoal({ title: '', description: '', techStack: '', deadline: '' });
      setCodingGoal({ title: '', username: '', targetProblems: '', targetDays: '' });
      
      fetchGoals();
    } catch (error) {
       toast.error(error.response?.data?.message || 'Error creating goal');
    }
  };

  const updateGoalStatus = async (id, status, type) => {
    try {
      await api.put(`/goals/${id}`, { status });
      if (status === 'completed') {
        const xp = type === 'project' ? 500 : type === 'coding' ? 400 : 200;
        toast.success(`Goal Completed! +${xp} XP 🎉`);
      }
      fetchGoals();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  if (loading) return <div className="loading-state">Loading Goals...</div>;

  const xp = data.gamification?.points || 0;
  const level = data.gamification?.currentLevel || 1;

  const getCodingRecommendation = (codingDetails) => {
    const { easySolved, mediumSolved, hardSolved, problemsSolvedYesterday: yest, problemsSolvedToday: today } = codingDetails;
    
    // Priority 1: Streak Warnings
    if (today === 0 && yest > 0) return `⚠️ Keep the streak alive! You solved ${yest} yesterday, don't stop now.`;
    if (today === 0) return "🚀 Start your streak today! Solve 1 easy problem.";

    // Priority 2: User's custom analytics suggestion
    if (mediumSolved < easySolved) {
      return "🎯 Focus on medium problems";
    }
    if (hardSolved < 10) {
      return "🧠 Start solving hard problems weekly";
    }
    
    return "🔥 Good progress, keep going!";
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Goals & Missions</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* XP Card */}
        <div className="metric-card" style={{ 
          textAlign: 'center', 
          background: 'linear-gradient(145deg, #0E1320, #141B2D)',
          borderColor: 'var(--border-medium)'
        }}>
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontStyle: 'italic', 
            color: 'var(--accent-gold)', 
            marginBottom: '1.5rem',
            fontSize: '1.6rem'
          }}>
            Level {level}
          </h2>
          
          <div style={{ width: 130, height: 130, margin: '0 auto' }}>
            <CircularProgressbar 
              value={xp % 1000} 
              maxValue={1000}
              text={`${xp} XP`}
              styles={buildStyles({
                textColor: '#C9A96E',
                textSize: '14px',
                pathColor: '#C9A96E',
                trailColor: 'rgba(201, 169, 110, 0.1)'
              })}
            />
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {1000 - (xp % 1000)} XP to next level
          </p>
        </div>

        {/* New Goal Form with Tabs */}
        <div className="metric-card">
          <h3>Set a New Mission</h3>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
            {['academic', 'coding', 'project'].map(type => (
              <button key={type} 
                onClick={() => setGoalType(type)}
                style={{
                  padding: '6px 12px', 
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: goalType === type ? 'var(--accent-gold)' : 'transparent',
                  color: goalType === type ? '#080C18' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase'
              }}>{type}</button>
            ))}
          </div>

          <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            
            {goalType === 'academic' && (
              <>
                <input type="text" placeholder="e.g., Get 85% in OS" required 
                  className="input-field" value={academicGoal.title} 
                  onChange={e => setAcademicGoal({...academicGoal, title: e.target.value})} />
                <input type="number" placeholder="Target Score / %" required 
                  className="input-field" value={academicGoal.targetPercentage} 
                  onChange={e => setAcademicGoal({...academicGoal, targetPercentage: e.target.value})} />
                <input type="date" required className="input-field" value={academicGoal.deadline} 
                  onChange={e => setAcademicGoal({...academicGoal, deadline: e.target.value})}
                  style={{ colorScheme: 'dark' }} />
              </>
            )}

            {goalType === 'coding' && (
              <>
                <input type="text" placeholder="e.g., 100 Problems in 100 Days" required 
                  className="input-field" value={codingGoal.title} 
                  onChange={e => setCodingGoal({...codingGoal, title: e.target.value})} />
                <input type="text" placeholder="LeetCode Username" required 
                  className="input-field" value={codingGoal.username} 
                  onChange={e => setCodingGoal({...codingGoal, username: e.target.value})} />
                <div style={{ display: 'flex', gap: '10px' }}>
                   <input type="number" placeholder="Target Problems" required 
                      className="input-field" value={codingGoal.targetProblems} 
                      onChange={e => setCodingGoal({...codingGoal, targetProblems: e.target.value})} />
                   <input type="number" placeholder="Target Days" required 
                      className="input-field" value={codingGoal.targetDays} 
                      onChange={e => setCodingGoal({...codingGoal, targetDays: e.target.value})} />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>We will live-sync your LeetCode progress daily to track your streak.</p>
              </>
            )}

            {goalType === 'project' && (
              <>
                <input type="text" placeholder="e.g., Build an AI Exam Grader" required 
                  className="input-field" value={projectGoal.title} 
                  onChange={e => setProjectGoal({...projectGoal, title: e.target.value})} />
                <input type="text" placeholder="Tech Stack (comma separated) e.g., MERN, React" required 
                  className="input-field" value={projectGoal.techStack} 
                  onChange={e => setProjectGoal({...projectGoal, techStack: e.target.value})} />
                <textarea placeholder="Detailed Project Overview..." required 
                  className="input-field" rows="3" value={projectGoal.description} 
                  onChange={e => setProjectGoal({...projectGoal, description: e.target.value})} />
                <input type="date" required className="input-field" value={projectGoal.deadline} 
                  onChange={e => setProjectGoal({...projectGoal, deadline: e.target.value})}
                  style={{ colorScheme: 'dark' }} />
              </>
            )}

            <button type="submit" className="auth-button">🎯 Set Mission</button>
          </form>
        </div>

        {/* Current Goals List */}
        <div className="metric-card" style={{ gridColumn: 'span 2' }}>
          <h3>Active Missions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {data.goals.length === 0 && (
              <p style={{ color: 'var(--text-secondary)' }}>No active missions. Set one above!</p>
            )}
            
            {data.goals.map((g) => (
              <div key={g._id} style={{ 
                padding: '16px', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 'var(--radius-sm)', 
                display: 'flex', 
                flexDirection: 'column',
                gap: '12px',
                background: g.status === 'completed' ? 'rgba(74, 222, 128, 0.05)' : 'var(--bg-primary)',
                transition: 'var(--transition)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  
                  {/* Left Side: Title & Dynamic Data */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ 
                        fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase',
                        background: g.type === 'coding' ? 'rgba(56, 189, 248, 0.15)' : g.type === 'project' ? 'rgba(192, 132, 252, 0.15)' : 'rgba(201, 169, 110, 0.15)',
                        color: g.type === 'coding' ? '#38BDF8' : g.type === 'project' ? '#C084FC' : '#C9A96E'
                      }}>
                        {g.type || 'academic'}
                      </span>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '1rem' }}>
                        {g.title}
                      </h4>
                    </div>

                    {/* ACADEMIC DATA */}
                    {(!g.type || g.type === 'academic') && (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Target: {g.targetPercentage}% · Due: {new Date(g.deadline).toLocaleDateString()}
                      </p>
                    )}

                    {/* PROJECT DATA */}
                    {g.type === 'project' && g.projectDetails && (
                      <div>
                        <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {g.projectDetails.description}
                        </p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                           {g.projectDetails.techStack.map(t => (
                             <span key={t} style={{ fontSize:'0.7rem', border:'1px solid var(--border-subtle)', padding:'2px 8px', borderRadius:'10px', color:'var(--text-muted)' }}>{t}</span>
                           ))}
                        </div>
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {new Date(g.deadline).toLocaleDateString()}</p>
                      </div>
                    )}

                    {/* CODING DATA (Daily Winning Card) */}
                    {g.type === 'coding' && g.codingDetails && (
                      <div style={{ marginTop: '12px', background: 'rgba(56, 189, 248, 0.03)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.5rem' }}>🔥</span>
                            <div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Streak</div>
                              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#38BDF8' }}>{g.codingDetails.currentStreak || 0} Days</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📅 Today</div>
                              <div style={{ fontSize: '0.9rem' }}>{g.codingDetails.solvedToday ? 'Solved ✅' : 'No Activity ❌'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📉 Yesterday</div>
                              <div style={{ fontSize: '0.9rem' }}>{g.codingDetails.solvedYesterday ? 'Solved ✅' : 'No Activity ❌'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Goal Progress</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                              {Math.max(0, (g.codingDetails.currentProblemsSolved - g.codingDetails.startingProblemsSolved))} / {g.codingDetails.targetProblems}
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                             <div style={{ 
                               height: '100%', 
                               background: 'linear-gradient(90deg, #38BDF8, #818CF8)',
                               width: `${Math.min(100, ((g.codingDetails.currentProblemsSolved - g.codingDetails.startingProblemsSolved) / g.codingDetails.targetProblems) * 100)}%` 
                             }}></div>
                          </div>
                        </div>

                        {/* Difficulty Breakdown - Winning Card Style */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                           <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                              <div style={{ fontSize: '0.65rem', color: '#4ADE80', textTransform: 'uppercase', marginBottom: '4px' }}>Easy</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>{g.codingDetails.easySolved}</div>
                           </div>
                           <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                              <div style={{ fontSize: '0.65rem', color: '#FBBF24', textTransform: 'uppercase', marginBottom: '4px' }}>Medium</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>{g.codingDetails.mediumSolved}</div>
                           </div>
                           <div style={{ background: 'rgba(248, 113, 113, 0.1)', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                              <div style={{ fontSize: '0.65rem', color: '#F87171', textTransform: 'uppercase', marginBottom: '4px' }}>Hard</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>{g.codingDetails.hardSolved}</div>
                           </div>
                        </div>
                        
                        <div style={{ padding: '10px 14px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px', borderLeft: '4px solid #38BDF8', display: 'flex', alignItems: 'center', gap: '10px' }}>
                           <span style={{ fontSize: '1.2rem' }}>💡</span>
                           <span style={{ fontSize: '0.85rem', color: '#BAE6FD', fontWeight: '500' }}>
                             {getCodingRecommendation(g.codingDetails)}
                           </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Status Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', minWidth: '100px' }}>
                    <span style={{ 
                      fontWeight: '700', 
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: g.status === 'completed' ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {g.status}
                    </span>
                    
                    {g.status !== 'completed' && g.type !== 'coding' && (
                      <button onClick={() => updateGoalStatus(g._id, 'completed', g.type)} 
                        style={{ 
                          background: 'linear-gradient(135deg, var(--success), #22C55E)', 
                          color: '#080C18', 
                          padding: '6px 14px', 
                          border: 'none', 
                          borderRadius: 'var(--radius-sm)', 
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '0.8rem',
                          transition: 'var(--transition)'
                        }}>
                        ✓ Complete
                      </button>
                    )}
                    {g.status !== 'completed' && g.type === 'coding' && (
                       <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                          Auto-completes<br/>via LeetCode
                       </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsAndGaming;
