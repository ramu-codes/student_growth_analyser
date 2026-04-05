from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd

# ---------------------------------------------
# Initialize Flask App
# ---------------------------------------------
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin requests (for frontend & backend connection)

# ---------------------------------------------
# Load ML Model (Optional – works even if missing)
# ---------------------------------------------
model = None
try:
    model = joblib.load('growth_model.pkl')
    print("✅ Model loaded successfully.")
except FileNotFoundError:
    print("⚠️ Model not found! Please run 'train.py' to create 'growth_model.pkl'.")
    model = None
except Exception as e:
    print(f"⚠️ Error loading model: {e}")
    model = None


# ---------------------------------------------
# Routes
# ---------------------------------------------

# ✅ Test route to verify service is running
@app.route('/', methods=['GET'])
def home():
    return "🚀 ML Service is running and ready to handle predictions."


# ✅ Main prediction endpoint
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        print("📦 Data received:", data)

        # ----------------------------
        # If model is available → use it
        # Else → return dummy data
        # ----------------------------
        if model is not None:
            input_data = [
                data.get('gpa', 0),
                data.get('attendance', 0),
                data.get('leetcode_problems', 0),
                data.get('github_commits', 0),
                data.get('extracurricular_hours', 0)
            ]
            features = [np.array(input_data)]
            prediction = model.predict(features)
            growth_index = round(float(prediction[0]), 2)

            response = {
                "growthIndex": growth_index,
                "recommendation": f"Model predicted a score of {growth_index}. Keep improving your skills!"
            }

        else:
            # Enhanced dynamic fallback based on subject marks
            marks = data.get('marks', [])
            if not marks:
                growth_index = max(data.get('gpa', 0) * 10, 50.0) # Assume base 50 if totally empty
                return jsonify({
                    "growthIndex": growth_index,
                    "recommendation": "Start logging your subject marks to generate a true growth index!"
                })
            
            df = pd.DataFrame(marks)
            if 'score' in df.columns and 'maxScore' in df.columns:
                 df['percentage'] = (df['score'] / df['maxScore']) * 100
                 growth_index = round(df['percentage'].mean(), 2)
                 
                 recommendation = f"Your current tracked average is {growth_index}%. Compare this with your Class Average in Analytics!"
            else:
                 growth_index = 65.0
                 recommendation = "Log complete score metrics to calculate an accurate growth."

            response = {
                "growthIndex": growth_index,
                "recommendation": recommendation
            }

        return jsonify(response)

    except Exception as e:
        print(f"❌ Error in /predict: {e}")
        return jsonify({"error": str(e)}), 400


# ---------------------------------------------
# New Endpoints for Smart Features
# ---------------------------------------------

@app.route('/smart-insights', methods=['POST'])
def smart_insights():
    try:
        data = request.get_json()
        marks = data.get('marks', [])
        
        if not marks:
            return jsonify({"insights": ["Not enough data to generate insights yet. Add more exam marks!"]})
            
        # Basic rule-based insight generation
        insights = []
        df = pd.DataFrame(marks)
        
        if 'subject' in df.columns and 'score' in df.columns and 'maxScore' in df.columns:
            df['percentage'] = (df['score'] / df['maxScore']) * 100
            
            # Find subject with lowest average
            avg_per_sub = df.groupby('subject')['percentage'].mean()
            lowest_sub = avg_per_sub.idxmin()
            highest_sub = avg_per_sub.idxmax()
            
            insights.append(f"Your weakest subject overall is {lowest_sub} ({avg_per_sub[lowest_sub]:.1f}%).")
            insights.append(f"Excellent performance in {highest_sub} ({avg_per_sub[highest_sub]:.1f}%).")
            
            # Check for low attendance
            if 'attendancePercentage' in df.columns:
                avg_att = df['attendancePercentage'].mean()
                if avg_att < 75:
                   insights.append(f"Warning: Low overall attendance ({avg_att:.1f}%) might be impacting your grades.")
                   
        return jsonify({"insights": insights})
    
    except Exception as e:
        print(f"❌ Error in /smart-insights: {e}")
        return jsonify({"error": str(e)}), 400

@app.route('/recommendations', methods=['POST'])
def recommendations():
    try:
        data = request.get_json()
        marks = data.get('marks', [])
        
        if not marks:
            return jsonify({"recommendations": ["Start by logging your academic performance."] })
            
        df = pd.DataFrame(marks)
        recommendations = []
        
        if 'subject' in df.columns and 'score' in df.columns and 'maxScore' in df.columns:
            df['percentage'] = (df['score'] / df['maxScore']) * 100
            avg_per_sub = df.groupby('subject')['percentage'].mean()
            lowest_sub = avg_per_sub.idxmin()
            
            recommendations.append(f"Focus primarily on {lowest_sub}. Allocate 40% of your study time to this subject.")
            recommendations.append("Review previous exam mistakes and try explaining concepts out loud.")
            
        return jsonify({"recommendations": recommendations})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/study-roadmap', methods=['POST'])
def study_roadmap():
    try:
        data = request.get_json()
        marks = data.get('marks', [])
        
        roadmap = [
            {"week": "Week 1", "task": "Identify knowledge gaps and gather study materials."},
            {"week": "Week 2", "task": "Practice fundamental concepts and solve basic problems."},
            {"week": "Week 3", "task": "Attempt past papers and timed mock tests."},
            {"week": "Week 4", "task": "Final revision and focus on weak areas discovered in mocks."}
        ]
        
        if marks:
            df = pd.DataFrame(marks)
            if 'subject' in df.columns:
                df['percentage'] = (df['score'] / df['maxScore']) * 100
                lowest_sub = df.groupby('subject')['percentage'].mean().idxmin()
                
                roadmap = [
                    {"week": "Week 1", "task": f"Focus intensely on {lowest_sub}. Re-read core textbook chapters."},
                    {"week": "Week 2", "task": f"Practice related problems in {lowest_sub} and clarify doubts with professors."},
                    {"week": "Week 3", "task": f"Write a mock test for {lowest_sub}. Continue reviewing other subjects."},
                    {"week": "Week 4", "task": "Comprehensive revision across all subjects. Ensure 80%+ attendance."}
                ]
                
        return jsonify({"roadmap": roadmap})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ---------------------------------------------
# Run the App
# ---------------------------------------------
if __name__ == '__main__':
    app.run(debug=True, port=8000)
