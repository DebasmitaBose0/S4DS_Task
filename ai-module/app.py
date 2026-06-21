import os
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

app = Flask(__name__)
CORS(app)

# Role mapping
ROLE_MAP = {'Admin': 0, 'Doctor': 1, 'Receptionist': 2, 'Unknown': 3}
# Action mapping
ACTION_MAP = {
    'LOGIN': 0, 
    'READ': 1, 
    'CREATE': 2, 
    'UPDATE': 3, 
    'DELETE': 4, 
    'LOGIN_FAIL': 5, 
    'UNAUTHORIZED_ATTEMPT': 6
}

def generate_baseline_data():
    """Generate mock baseline dataset of 'normal' healthcare activities to train the ML model."""
    data = []
    
    # Standard doctor behavior (mostly READ/UPDATE during business hours)
    for i in range(100):
        hour = np.random.randint(9, 17) # 9 AM to 5 PM
        data.append({
            'role_num': ROLE_MAP['Doctor'],
            'action_num': np.random.choice([ACTION_MAP['READ'], ACTION_MAP['UPDATE']], p=[0.7, 0.3]),
            'is_success': 1,
            'hour': hour,
            'is_weekend': 0
        })

    # Standard receptionist behavior (mostly CREATE/READ during business hours)
    for i in range(80):
        hour = np.random.randint(8, 18) # 8 AM to 6 PM
        data.append({
            'role_num': ROLE_MAP['Receptionist'],
            'action_num': np.random.choice([ACTION_MAP['CREATE'], ACTION_MAP['READ']], p=[0.6, 0.4]),
            'is_success': 1,
            'hour': hour,
            'is_weekend': 0
        })

    # Rare admin actions
    for i in range(20):
        hour = np.random.randint(9, 18)
        data.append({
            'role_num': ROLE_MAP['Admin'],
            'action_num': np.random.choice([ACTION_MAP['LOGIN'], ACTION_MAP['READ']], p=[0.2, 0.8]),
            'is_success': 1,
            'hour': hour,
            'is_weekend': 0
        })

    # A few random minor anomalies/failed logins (e.g. 5% contamination)
    for i in range(10):
        data.append({
            'role_num': np.random.choice(list(ROLE_MAP.values())),
            'action_num': ACTION_MAP['LOGIN_FAIL'],
            'is_success': 0,
            'hour': np.random.randint(0, 24),
            'is_weekend': np.random.choice([0, 1])
        })

    return pd.DataFrame(data)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        content = request.get_json()
        logs = content.get('logs', [])

        if not logs:
            return jsonify({'predictions': []})

        # Parse logs to features
        input_data = []
        for log in logs:
            timestamp = pd.to_datetime(log.get('timestamp', datetime.datetime.now().isoformat()))
            
            role = log.get('role', 'Unknown')
            action = log.get('action', 'READ')
            
            role_num = ROLE_MAP.get(role, 3)
            action_num = ACTION_MAP.get(action, 1)
            is_success = int(log.get('isSuccess', 1))
            hour = timestamp.hour
            is_weekend = 1 if timestamp.weekday() >= 5 else 0

            input_data.append({
                'id': log.get('id'),
                'role_num': role_num,
                'action_num': action_num,
                'is_success': is_success,
                'hour': hour,
                'is_weekend': is_weekend,
                'action_raw': action
            })

        df_input = pd.DataFrame(input_data)
        features = ['role_num', 'action_num', 'is_success', 'hour', 'is_weekend']

        # Get baseline + input combined to build feature array
        df_baseline = generate_baseline_data()
        
        # Fit Isolation Forest on baseline normal data
        clf = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
        clf.fit(df_baseline[features])

        # Predict outliers on input
        # -1 = anomaly, 1 = normal
        predictions = clf.predict(df_input[features])
        scores = clf.decision_function(df_input[features])

        results = []
        for i, row in df_input.iterrows():
            is_anomaly = bool(predictions[i] == -1)
            score = float(scores[i])
            
            # Translate score to confidence (0-100%)
            # decision_function output: negative is anomaly, positive is normal.
            confidence = int(min(100, max(50, (abs(score) * 150) + 50)))

            # Override/Reinforce severity categories based on critical indicators
            action_raw = row['action_raw']
            success_raw = row['is_success']

            risk_level = 'LOW'
            if is_anomaly:
                if action_raw == 'UNAUTHORIZED_ATTEMPT':
                    risk_level = 'HIGH'
                elif action_raw == 'DELETE':
                    risk_level = 'MEDIUM'
                elif action_raw == 'LOGIN_FAIL':
                    risk_level = 'MEDIUM'
                else:
                    risk_level = 'LOW'

            results.append({
                'id': row['id'],
                'isAnomalous': is_anomaly,
                'riskLevel': risk_level,
                'confidence': confidence
            })

        return jsonify({'predictions': results})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'AI_MODULE_ONLINE', 'algorithm': 'Isolation Forest'})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5002, debug=False)
