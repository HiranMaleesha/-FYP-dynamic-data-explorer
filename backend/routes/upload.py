from fastapi import APIRouter, UploadFile, File
from fastapi.responses import FileResponse
import pandas as pd
import json
from io import BytesIO
import uuid
import os
import boto3
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv
from services.transform import transform_data
from services.analytics import compute_insights

load_dotenv()

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION')
)

def upload_to_s3(file_content, filename, bucket_name):
    try:
        print(f"Attempting to upload {filename} to bucket {bucket_name}")
        s3_client.put_object(
            Bucket=bucket_name,
            Key=filename,
            Body=file_content,
            ContentType='text/csv'
        )
        s3_url = f"https://{bucket_name}.s3.amazonaws.com/{filename}"
        print(f"Successfully uploaded to: {s3_url}")
        return s3_url
    except NoCredentialsError as e:
        print(f"S3 credentials error: {e}")
        return None
    except Exception as e:
        print(f"S3 upload error: {e}")
        return None

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()

    # Upload to S3
    bucket_name = os.getenv('S3_BUCKET_NAME')
    print(f"Bucket name from env: {bucket_name}")
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    print(f"Uploading file: {unique_filename}")
    s3_url = upload_to_s3(contents, unique_filename, bucket_name)

    if not s3_url:
        print("S3 upload failed")
        return {"error": "Failed to upload file to S3"}

    # Detect CSV vs Excel and process data
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
        "insights": insights,
        "s3_url": s3_url,
        "filename": unique_filename
    }

