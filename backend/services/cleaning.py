import pandas as pd

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    # Drop rows where 'Progress' is NaN, if column exists
    if 'Progress' in df.columns:
        df = df.dropna(subset=['Progress'])
    else:
        df = df.dropna(how='all')  # Fallback: drop rows where all elements are NaN
    df = df.drop_duplicates()  # Remove duplicate rows
    df.columns = df.columns.str.strip()  # Strip whitespace from column names
    return df

    