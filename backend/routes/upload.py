from fastapi import APIRouter, UploadFile, File
import pandas as pd
from io import BytesIO
from services.cleaning import clean_data
from services.transform import transform_data

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()

    # Detect CSV vs Excel
    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    else:
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")

    df = clean_data(df)
    df = transform_data(df)

    # Get preview and replace NaN with None for JSON serialization
    preview = df.head(5).to_dict(orient="records")
    for row in preview:
        for key, value in row.items():
            if pd.isna(value):
                row[key] = None

    return {
        "columns": df.columns.tolist(),
        "preview": preview
    }
