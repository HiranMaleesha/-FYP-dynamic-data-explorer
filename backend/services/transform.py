import pandas as pd

def transform_data(df: pd.DataFrame) -> pd.DataFrame:
    for col in df.columns:
        if 'date' in col.lower():
            df[col] = pd.to_datetime(df[col], errors='coerce')
    return df