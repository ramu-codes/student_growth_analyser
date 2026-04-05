import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import joblib # For saving the model

# 1. Load the dataset
try:
    df = pd.read_csv('student_data.csv')
except FileNotFoundError:
    print("Error: 'student_data.csv' not found.")
    print("Please run 'python create_data.py' first.")
    exit()

print("Dataset loaded.")

# 2. Define Features (X) and Target (y)
features = ['gpa', 'attendance', 'leetcode_problems', 'github_commits', 'extracurricular_hours']
target = 'growth_index'

X = df[features]
y = df[target]

# 3. Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Choose and Train the Model
# We'll use Linear Regression because it's simple and fast.
model = LinearRegression()
model.fit(X_train, y_train)

print("Model trained.")

# 5. (Optional) Evaluate the model
y_pred = model.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
print(f"Model evaluation (Mean Squared Error): {mse:.2f}")

# 6. Save the trained model to a file
model_filename = 'growth_model.pkl'
joblib.dump(model, model_filename)

print(f"Model saved as '{model_filename}'")