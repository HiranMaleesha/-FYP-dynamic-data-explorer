from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
from io import BytesIO
import os
from groq import Groq
from .upload import download_from_s3

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    filename: str  # S3 filename from upload response

class ChatResponse(BaseModel):
    answer: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_csv(request: ChatRequest):
    try:
        # Download CSV from S3
        bucket_name = os.getenv('S3_BUCKET_NAME')
        csv_content = download_from_s3(request.filename, bucket_name)

        if not csv_content:
            raise HTTPException(status_code=404, detail="CSV file not found in S3")

        # Convert to pandas DataFrame - handle both CSV and Excel
        try:
            if request.filename.endswith('.xlsx') or request.filename.endswith('.xls'):
                print("Reading Excel file...")
                df = pd.read_excel(BytesIO(csv_content), engine='openpyxl')
            else:
                print("Reading CSV file...")
                df = pd.read_csv(BytesIO(csv_content))
            print(f"Successfully loaded DataFrame with shape: {df.shape}")
            print(f"Columns: {list(df.columns)}")
            print(f"First few rows:\n{df.head(2)}")
        except Exception as e:
            print(f"Error reading file: {e}")
            import traceback
            traceback.print_exc()
            return ChatResponse(answer="I couldn't read the data file. Please ensure you've uploaded a valid CSV or Excel file and try again.")

        # Use AI with full dataset context for all queries
        client = Groq(api_key=os.getenv('GROQ_API_KEY'))

        # Hybrid approach: Direct analysis for common queries, AI for complex ones
        question = request.question.lower()

        # Handle common queries with direct pandas analysis (accurate and fast)
        if "top manufacturer" in question or "most sold manufacturer" in question or "top manufacturers" in question:
            if 'Manufacturer' in df.columns:
                manufacturer_counts = df['Manufacturer'].value_counts()
                top_5 = manufacturer_counts.head(5)
                response = "Top manufacturers by sales:\n" + "\n".join([f"{i+1}. {manufacturer}: {count:,} vehicles" for i, (manufacturer, count) in enumerate(top_5.items())])
                return ChatResponse(answer=response)

        elif "average price" in question or "avg price" in question:
            if 'Price_LKR' in df.columns:
                avg_price = df['Price_LKR'].mean()
                return ChatResponse(answer=f"The average selling price is LKR {avg_price:,.0f}.")

        elif "fuel type" in question or "fuel distribution" in question:
            if 'Fuel type' in df.columns:
                fuel_counts = df['Fuel type'].value_counts()
                response = "Fuel type distribution:\n" + "\n".join([f"- {fuel}: {count:,} vehicles ({count/len(df)*100:.1f}%)" for fuel, count in fuel_counts.items()])
                return ChatResponse(answer=response)

        elif "total vehicles" in question or "how many vehicles" in question:
            total = len(df)
            return ChatResponse(answer=f"There are {total:,} vehicles in the dataset.")

        # For complex queries, use AI with optimized context (much smaller)
        # Create compact summary instead of full data
        stats_text = f"""
Dataset Summary:
- Total Records: {len(df):,}
- Average Price: LKR {df.get('Price_LKR', pd.Series()).mean():,.0f}
- Price Range: LKR {df.get('Price_LKR', pd.Series()).min():,.0f} - LKR {df.get('Price_LKR', pd.Series()).max():,.0f}
- Top Manufacturer: {df.get('Manufacturer', pd.Series()).mode().iloc[0] if len(df.get('Manufacturer', pd.Series())) > 0 else 'N/A'}
- Fuel Types: {', '.join(df.get('Fuel type', pd.Series()).value_counts().head(3).index.tolist())}
"""

        # Determine if question is dataset-related or general
        dataset_keywords = ['manufacturer', 'price', 'fuel', 'vehicle', 'sales', 'trend', 'average', 'total', 'top', 'most', 'distribution', 'profit', 'year', 'month']
        is_dataset_related = any(keyword in question for keyword in dataset_keywords)

        if is_dataset_related:
            data_context = f"""
Based on the provided dataset:

{stats_text}

Question: {request.question}

Provide a direct, data-driven answer based on the statistics above. For predictions, use the trends shown in the data.
"""
            system_prompt = "You are a vehicle sales analyst. Always start your response with 'Based on the provided dataset' when answering dataset-related questions. Use the provided data statistics to give direct, actionable answers. Base predictions on the data trends shown."
        else:
            data_context = f"""
General Question: {request.question}

Answer this question about the Sri Lankan vehicle market or general automotive knowledge. Use current market trends and general knowledge.
"""
            system_prompt = "You are a knowledgeable assistant about the Sri Lankan vehicle market and general automotive topics. Answer questions directly and informatively without mentioning any specific dataset unless relevant."

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": data_context,
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=600,  # Reasonable limit
        )

        response = chat_completion.choices[0].message.content
        return ChatResponse(answer=response)

    except Exception as e:
        print(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
        return ChatResponse(answer="Sorry, I encountered an error processing your question. Please try again or rephrase your question.")