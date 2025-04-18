import sqlite3
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
from sklearn.preprocessing import LabelEncoder

def fetch_feedback_data(db_path):
    """Fetch feedback data from the SQLite database."""
    conn = sqlite3.connect(db_path)
    query = "SELECT * FROM feedback"
    feedback_df = pd.read_sql(query, conn)
    conn.close()
    return feedback_df

def preprocess_feedback_data(feedback_df):
    """Preprocess feedback data for model training."""
    label_encoder = LabelEncoder()
    feedback_df['analyst_label'] = feedback_df['analyst_label'].map({'Incorrect': 0, 'Correct': 1})
    feedback_df['predicted_label'] = label_encoder.fit_transform(feedback_df['predicted_label'])

    X = feedback_df[['sus', 'predicted_label', 'risk_score', 'analyst_label']]
    y = feedback_df['analyst_label']
    return X, y

def retrain_model(X, y, model_filename):
    """Retrain the model with new data."""
    model = joblib.load(model_filename)
    model.fit(X, y)
    joblib.dump(model, model_filename)
    return model

