import pandas as pd
import numpy as np

# Number of dummy students
NUM_STUDENTS = 200

# Generate fake data
data = {
    'gpa': np.random.uniform(5.0, 10.0, NUM_STUDENTS).round(2),
    'attendance': np.random.randint(60, 100, NUM_STUDENTS),
    'leetcode_problems': np.random.randint(0, 300, NUM_STUDENTS),
    'github_commits': np.random.randint(0, 500, NUM_STUDENTS),
    'extracurricular_hours': np.random.randint(0, 100, NUM_STUDENTS)
}

df = pd.DataFrame(data)

# --- Create the Target Variable: "Growth Index" ---
# This is our "secret sauce". We are *defining* what "growth" means.
# This formula is arbitrary. You can and *should* change it later.
def calculate_growth_index(row):
    gpa_score = (row['gpa'] / 10.0) * 40  # 40% weight
    leetcode_score = min(row['leetcode_problems'] / 200, 1) * 30 # 30% weight
    github_score = min(row['github_commits'] / 400, 1) * 15 # 15% weight
    activity_score = min(row['extracurricular_hours'] / 80, 1) * 10 # 10% weight
    attendance_score = (row['attendance'] / 100) * 5 # 5% weight
    
    total_score = gpa_score + leetcode_score + github_score + activity_score + attendance_score
    return round(total_score, 2)

# Apply the formula to create the target column
df['growth_index'] = df.apply(calculate_growth_index, axis=1)

# Save to CSV
df.to_csv('student_data.csv', index=False)

print(f"Successfully created 'student_data.csv' with {NUM_STUDENTS} rows.")
print(df.head())