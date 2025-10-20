import pandas as pd

def transform_data(df: pd.DataFrame) -> pd.DataFrame:
    # Cleaning logic: Drop rows where 'Progress' is NaN, if column exists
    if 'Progress' in df.columns:
        df = df.dropna(subset=['Progress'])
    else:
        df = df.dropna(how='all')  # Fallback: drop rows where all elements are NaN
    df = df.drop_duplicates()  # Remove duplicate rows
    df.columns = df.columns.str.strip()  # Strip whitespace from column names

    # Remove rows with too many NaNs (more than 50% of columns are NaN)
    threshold = len(df.columns) * 0.5
    df = df.dropna(thresh=threshold)

    # Replace NaNs: numeric with median, categorical with mode
    for col in df.columns:
        if df[col].dtype in ['float64', 'int64']:
            # Numeric: fill with median
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
        elif df[col].dtype == 'object':
            # Categorical: fill with mode
            mode_val = df[col].mode()
            if not mode_val.empty:
                df[col] = df[col].fillna(mode_val[0])

    # Convert date columns to datetime
    for col in df.columns:
        if 'date' in col.lower():
            df[col] = pd.to_datetime(df[col], errors='coerce')
    return df