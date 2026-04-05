import React, { useState, useEffect, useMemo } from "react";
import { Line, Bar } from "react-chartjs-2";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { setupCharts } from "../services/chartConfig.js";
import ReportGenerator from "../components/ReportGenerator.jsx";
import api from "../services/api.js";
import "./Dashboard.css";

setupCharts();

const Dashboard = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [gpaChartData, setGpaChartData] = useState(null);
  const [goalsList, setGoalsList] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [semesterBreakdown, setSemesterBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [growthRes, goalsRes, semRes] = await Promise.all([
          api.get("/analysis/my-growth"),
          api.get("/goals"),
          api.get("/analysis/semester-breakdown").catch(() => ({ data: null })),
        ]);

        const data = growthRes.data;
        setAnalysisData(data);
        setGoalsList(goalsRes.data?.goals || []);
        setGamification(goalsRes.data?.gamification || null);
        setSemesterBreakdown(semRes?.data || null);

        if (data.gpaHistory && data.gpaHistory.length > 0) {
          const labels = data.gpaHistory.map((item) => item.label);
          const gpaValues = data.gpaHistory.map((item) => item.gpa);
          setGpaChartData({
            labels,
            datasets: [
              {
                label: "GPA Trend",
                data: gpaValues,
                fill: true,
                backgroundColor: "rgba(201, 169, 110, 0.1)",
                borderColor: "#C9A96E",
                pointBackgroundColor: "#C9A96E",
                tension: 0.4,
              },
            ],
          });
        }

        setError("");
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const gpaDeltaData = useMemo(() => {
    const hist = analysisData?.gpaHistory;
    if (!hist || hist.length < 2) return null;
    const labels = [];
    const values = [];
    for (let i = 1; i < hist.length; i++) {
      const delta = hist[i].gpa - hist[i - 1].gpa;
      labels.push(`${hist[i - 1].label} → ${hist[i].label}`);
      values.push(Number(delta.toFixed(2)));
    }
    return {
      labels,
      datasets: [
        {
          label: "GPA change",
          data: values,
          backgroundColor: values.map((v) =>
            v >= 0 ? "rgba(74, 222, 128, 0.55)" : "rgba(248, 113, 113, 0.5)"
          ),
          borderColor: values.map((v) => (v >= 0 ? "#4ADE80" : "#F87171")),
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    };
  }, [analysisData]);

  const semesterPctData = useMemo(() => {
    const sems = semesterBreakdown?.semesters;
    if (!sems || sems.length < 2) return null;
    const deltas = [];
    const labels = [];
    for (let i = 1; i < sems.length; i++) {
      const d = sems[i].percentage - sems[i - 1].percentage;
      labels.push(`${sems[i - 1].semester} → ${sems[i].semester}`);
      deltas.push(Number(d.toFixed(1)));
    }
    return {
      labels,
      datasets: [
        {
          label: "Semester % change",
          data: deltas,
          backgroundColor: deltas.map((v) =>
            v >= 0 ? "rgba(96, 165, 250, 0.45)" : "rgba(248, 113, 113, 0.45)"
          ),
          borderColor: deltas.map((v) => (v >= 0 ? "#60A5FA" : "#F87171")),
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    };
  }, [semesterBreakdown]);

  const getGrowthColor = (value) => {
    if (value > 75) return "#4ADE80";
    if (value > 50) return "#FBBF24";
    return "#F87171";
  };

  const getMotivationalMessage = (index) => {
    if (index > 75) return "🔥 Excellent! You're performing at your best!";
    if (index > 50) return "💪 Great progress — stay consistent!";
    return "🚀 Keep pushing! Small daily efforts compound.";
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: "rgba(247,244,239,0.5)", maxRotation: 45, minRotation: 0 }, grid: { color: "rgba(201,169,110,0.07)" } },
      y: { ticks: { color: "rgba(247,244,239,0.5)" }, grid: { color: "rgba(201,169,110,0.07)" } },
    },
    plugins: { legend: { labels: { color: "#F7F4EF" } } },
  };

  const deltaOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        title: { display: true, text: "Δ GPA", color: "rgba(247,244,239,0.45)", font: { size: 11 } },
      },
    },
  };

  const semDeltaOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        title: { display: true, text: "Δ %", color: "rgba(247,244,239,0.45)", font: { size: 11 } },
      },
    },
  };

  if (loading) return <div className="loading-state">Loading AI Analysis...</div>;

  if (error) return (
    <div className="dashboard-container">
      <div className="dash-card" style={{ borderColor: "var(--danger)" }}>
        <h2 style={{ color: "var(--danger)" }}>Error</h2>
        <p style={{ color: "var(--text-secondary)" }}>{error}</p>
      </div>
    </div>
  );

  if (!analysisData) return (
    <div className="dashboard-container">
      <div className="dash-card">
        <h2 style={{ color: "var(--accent-gold)" }}>No analysis data found.</h2>
        <p style={{ color: "var(--text-secondary)" }}>Start by adding your marks in the "Input Marks" page.</p>
      </div>
    </div>
  );

  const growthColor = getGrowthColor(analysisData.growthIndex);
  const motivation = getMotivationalMessage(analysisData.growthIndex);

  return (
    <div className="dashboard-container dashboard-outer">
      <div className="dashboard-grid" id="dashboard-main">
        <div className="dash-card growth-index-card">
          <h2>Your Growth Index</h2>
          <div className="progress-bar-container">
            <CircularProgressbar
              value={analysisData.growthIndex}
              text={`${analysisData.growthIndex}%`}
              styles={buildStyles({
                pathColor: growthColor,
                textColor: growthColor,
                trailColor: "rgba(201, 169, 110, 0.1)",
              })}
            />
          </div>
          <p style={{ fontWeight: "600", color: growthColor, fontSize: "0.95rem" }}>{motivation}</p>
        </div>

        <div className="dash-card summary-card summary-card-1">
          <h3>Academic GPA</h3>
          <div className="value">{analysisData.gpa || "N/A"}</div>
          <div className="trend trend-green">Current GPA</div>
        </div>

        <div className="dash-card summary-card summary-card-2">
          <h3>Total XP</h3>
          <div className="value">{gamification?.points || 0}</div>
          <div className="trend trend-green">Gamification</div>
        </div>

        <div className="dash-card summary-card summary-card-3">
          <h3>Level</h3>
          <div className="value">{gamification?.currentLevel || 1}</div>
          <div className="trend trend-green">Keep leveling up!</div>
        </div>

        <div className="dash-card summary-card-4">
          <h3 style={{ color: "var(--accent-gold)", fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.2rem", marginBottom: "0.8rem" }}>
            AI Recommendation
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6" }}>
            {analysisData.recommendation || "Stay consistent and track your daily learning goals!"}
          </p>
          <ReportGenerator targetId="dashboard-main" filename="growth_analytics_report" />
        </div>

        <div className="dash-card chart-card-line">
          <h3>Your GPA Trend</h3>
          <div className="dash-chart-h">
            {gpaChartData ? (
              <Line data={gpaChartData} options={chartOptions} />
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>Add semesters in your Profile to see GPA trend.</p>
            )}
          </div>
        </div>

        <div className="dash-card chart-card-delta">
          <h3>GPA momentum</h3>
          <p className="chart-caption">Upward vs downward moves between consecutive semesters.</p>
          <div className="dash-chart-h dash-chart-h--sm">
            {gpaDeltaData ? (
              <Bar data={gpaDeltaData} options={deltaOptions} />
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>Add at least two semesters in Profile to see momentum.</p>
            )}
          </div>
        </div>

        <div className="dash-card chart-card-sem-delta">
          <h3>Semester performance shift</h3>
          <p className="chart-caption">Change in overall semester percentage (requires marks per semester).</p>
          <div className="dash-chart-h dash-chart-h--sm">
            {semesterPctData ? (
              <Bar data={semesterPctData} options={semDeltaOptions} />
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>Log marks across semesters to see this chart.</p>
            )}
          </div>
        </div>

        <div className="dash-card todo-preview">
          <h3>🎯 Active Goals</h3>
          {goalsList.length > 0 ? (
            goalsList.slice(0, 4).map((goal, i) => (
              <div key={i} className={`todo-item ${goal.status === "completed" ? "done" : ""}`}>
                <span>{goal.title}</span>
                <span>{goal.status === "completed" ? "✅" : "⏳"}</span>
              </div>
            ))
          ) : (
            <p style={{ color: "var(--text-secondary)" }}>No active goals. Set one in Goals!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
