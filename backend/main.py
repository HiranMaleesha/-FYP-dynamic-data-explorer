from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routes import upload, chat
import firebase_admin
from firebase_admin import credentials, auth
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate(os.path.join(os.path.dirname(__file__), 'data-explore-fyp-firebase-adminsdk-fbsvc-7f4441cad9.json'))
    firebase_admin.initialize_app(cred)
    print("Firebase Admin SDK initialized successfully")
except Exception as e:
    print(f"Firebase initialization error: {e}")
    # Fallback: try with environment variables if JSON file fails
    try:
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": os.getenv('FIREBASE_PROJECT_ID'),
            "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
            "private_key": os.getenv('FIREBASE_PRIVATE_KEY').replace('\\n', '\n'),
            "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
            "client_id": os.getenv('FIREBASE_CLIENT_ID'),
            "auth_uri": os.getenv('FIREBASE_AUTH_URI'),
            "token_uri": os.getenv('FIREBASE_TOKEN_URI'),
            "auth_provider_x509_cert_url": os.getenv('FIREBASE_AUTH_PROVIDER_X509_CERT_URL'),
            "client_x509_cert_url": os.getenv('FIREBASE_CLIENT_X509_CERT_URL'),
        })
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized with env vars")
    except Exception as e2:
        print(f"Firebase env var initialization also failed: {e2}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication middleware
@app.middleware("http")
async def authenticate_user(request: Request, call_next):
    # Skip auth for certain paths - allow upload and delete-user-files
    if request.url.path in ["/api/upload", "/api/delete-user-files", "/api/chat"] or not request.url.path.startswith("/api"):
        return await call_next(request)

    # Check for Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header missing or invalid")

    token = auth_header.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        request.state.user_id = decoded_token['uid']
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    response = await call_next(request)
    return response

app.include_router(upload.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
