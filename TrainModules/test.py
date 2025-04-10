import pandas as pd
from sklearn.datasets import load_breast_cancer
data = load_breast_cancer()
dataset = pd.DataFrame(data=data['data'], columns=data['feature_names'])

from sklearn.model_selection import train_test_split
X = dataset.copy()
y = data['target']
target_counts = pd.Series(y).value_counts()

print(target_counts)
print(X)