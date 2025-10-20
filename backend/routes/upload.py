from fastapi import APIRouter, UploadFile, File
from fastapi.responses import FileResponse
import pandas as pd
import json
from io import BytesIO
from services.transform import transform_data
from services.analytics import compute_insights

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()

    # Detect CSV vs Excel
    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(contents))
    else:
        df = pd.read_excel(BytesIO(contents), engine="openpyxl")

    df = transform_data(df)

    # Compute insights
    insights = compute_insights(df)

    # Get preview and replace NaN with None for JSON serialization
    preview = df.head(100).to_dict(orient="records")
    for row in preview:
        for key, value in row.items():
            if pd.isna(value):
                row[key] = None

    return {
        "columns": df.columns.tolist(),
        "preview": preview,
        "insights": insights
    }

