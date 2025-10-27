from fastapi import APIRouter, UploadFile, File, Request, HTTPException
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

# Helper functions for user file tracking
def load_user_files():
    try:
        with open('user_files.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_user_files(data):
    with open('user_files.json', 'w') as f:
        json.dump(data, f)

def get_user_files(user_id):
    data = load_user_files()
    return data.get(user_id, [])

def add_user_file(user_id, filename):
    data = load_user_files()
    if user_id not in data:
        data[user_id] = []
    data[user_id].append(filename)
    save_user_files(data)

def clear_user_files(user_id):
    data = load_user_files()
    if user_id in data:
        del data[user_id]
        save_user_files(data)

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

def download_from_s3(filename, bucket_name):
    try:
        print(f"Downloading {filename} from S3 bucket {bucket_name}")
        obj = s3_client.get_object(Bucket=bucket_name, Key=filename)
        return obj['Body'].read()
    except Exception as e:
        print(f"S3 download error: {e}")
        return None

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), request: Request = None):
    # Get user ID from middleware - allow unauthenticated uploads for now
    user_id = getattr(request.state, 'user_id', None)
    print(f"User ID from request: {user_id}")
    # Temporarily allow uploads without authentication for testing
    # if not user_id:
    #     raise HTTPException(status_code=401, detail="User not authenticated")

    contents = await file.read()

    # Upload to S3
    bucket_name = os.getenv('S3_BUCKET_NAME')
    print(f"Bucket name from env: {bucket_name}")
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    print(f"Uploading file: {unique_filename}")
    s3_url = upload_to_s3(contents, unique_filename, bucket_name)

    if not s3_url:
        print("S3 upload failed")
        raise HTTPException(status_code=500, detail="Failed to upload file to S3")

    # Track file for user (only if authenticated)
    if user_id:
        add_user_file(user_id, unique_filename)

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

@router.post("/delete-user-files")
async def delete_user_files(request: Request = None):
    # Get user ID from middleware
    user_id = getattr(request.state, 'user_id', None)
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    bucket_name = os.getenv('S3_BUCKET_NAME')
    user_files = get_user_files(user_id)

    deleted_files = []
    for filename in user_files:
        try:
            s3_client.delete_object(Bucket=bucket_name, Key=filename)
            deleted_files.append(filename)
            print(f"Deleted {filename} from S3")
        except Exception as e:
            print(f"Failed to delete {filename}: {e}")

    # Clear user's file records
    clear_user_files(user_id)

    return {"message": f"Deleted {len(deleted_files)} files", "deleted_files": deleted_files}


