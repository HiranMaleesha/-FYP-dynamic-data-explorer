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
        if "least sold manufacturer" in question or "lowest selling manufacturer" in question or "worst performing manufacturer" in question:
            if 'Manufacturer' in df.columns:
                manufacturer_counts = df['Manufacturer'].value_counts()
                least_sold = manufacturer_counts.tail(5)  # Bottom 5
                response = "Manufacturers with lowest sales:\n" + "\n".join([f"{i+1}. {manufacturer}: {count:,} vehicles" for i, (manufacturer, count) in enumerate(least_sold.items())])
                return ChatResponse(answer=response)

        elif "top manufacturer" in question or "most sold manufacturer" in question or "top manufacturers" in question:
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

        elif "most expensive" in question or "highest price" in question:
            if 'Price_LKR' in df.columns and 'Manufacturer' in df.columns and 'Model' in df.columns:
                max_price_row = df.loc[df['Price_LKR'].idxmax()]
                response = f"The most expensive vehicle is:\n- {max_price_row['Manufacturer']} {max_price_row['Model']}\n- Price: LKR {max_price_row['Price_LKR']:,.0f}"
                return ChatResponse(answer=response)

        elif "cheapest" in question or "lowest price" in question:
            if 'Price_LKR' in df.columns and 'Manufacturer' in df.columns and 'Model' in df.columns:
                min_price_row = df.loc[df['Price_LKR'].idxmin()]
                response = f"The cheapest vehicle is:\n- {min_price_row['Manufacturer']} {min_price_row['Model']}\n- Price: LKR {min_price_row['Price_LKR']:,.0f}"
                return ChatResponse(answer=response)

        elif "average mileage" in question or "avg mileage" in question:
            if 'Mileage' in df.columns:
                avg_mileage = df['Mileage'].mean()
                return ChatResponse(answer=f"The average mileage is {avg_mileage:,.0f} km.")

        elif "most popular model" in question or "top model" in question:
            if 'Model' in df.columns:
                model_counts = df['Model'].value_counts()
                top_model = model_counts.head(1)
                response = f"The most popular model is {top_model.index[0]} with {top_model.iloc[0]:,} vehicles sold."
                return ChatResponse(answer=response)

        elif "year of manufacture" in question or "manufacture year" in question:
            if 'Year of manufacture' in df.columns:
                year_counts = df['Year of manufacture'].value_counts().sort_index()
                most_common_year = year_counts.idxmax()
                response = f"The most common year of manufacture is {most_common_year} with {year_counts[most_common_year]:,} vehicles."
                return ChatResponse(answer=response)

        # For complex queries, use AI with full dataset context
        # Create comprehensive summary with detailed statistics
        stats_text = f"""
Dataset Summary:
- Total Records: {len(df):,}
- Average Price: LKR {df.get('Price_LKR', pd.Series()).mean():,.0f}
- Price Range: LKR {df.get('Price_LKR', pd.Series()).min():,.0f} - LKR {df.get('Price_LKR', pd.Series()).max():,.0f}
- Top Manufacturer: {df.get('Manufacturer', pd.Series()).mode().iloc[0] if len(df.get('Manufacturer', pd.Series())) > 0 else 'N/A'}
- Fuel Types: {', '.join(df.get('Fuel type', pd.Series()).value_counts().head(3).index.tolist())}

Detailed Statistics:
- Manufacturers: {', '.join(df.get('Manufacturer', pd.Series()).value_counts().head(5).index.tolist())}
- Models: {', '.join(df.get('Model', pd.Series()).value_counts().head(5).index.tolist())}
- Average Mileage: {df.get('Mileage', pd.Series()).mean():,.0f} km
- Average Holding Days: {df.get('Holding_Days', pd.Series([30])).mean():.0f} days
- Most Common Year: {df.get('Year of manufacture', pd.Series()).mode().iloc[0] if len(df.get('Year of manufacture', pd.Series())) > 0 else 'N/A'}
"""

        # Determine if question is dataset-related or general
        dataset_keywords = ['manufacturer', 'price', 'fuel', 'vehicle', 'sales', 'trend', 'average', 'total', 'top', 'most', 'least', 'lowest', 'worst', 'distribution', 'profit', 'year', 'month', 'mileage', 'model', 'expensive', 'cheap', 'cheapest', 'popular']
        is_dataset_related = any(keyword in question for keyword in dataset_keywords)

        if is_dataset_related:
            # Provide full dataset context for AI analysis
            data_context = f"""
Based on the uploaded dataset with {len(df):,} vehicle records:

{stats_text}

Question: {request.question}

Analyze the uploaded CSV/Excel data and provide a concise, accurate answer. Use actual data analysis to answer questions about manufacturers, prices, trends, distributions, etc. Keep answers brief and to the point - only provide detailed explanations when specifically requested.
"""
            system_prompt = "You are a vehicle sales data analyst. Analyze the provided dataset and give direct, concise answers. Reference specific data points when relevant. Keep responses brief unless detailed analysis is requested. Focus on facts and numbers from the dataset."
        else:
            data_context = f"""
General Question: {request.question}

Answer this question about the Sri Lankan vehicle market, automotive industry, or general vehicle knowledge. Keep answers concise and to the point.
"""
            system_prompt = "You are a knowledgeable assistant about the Sri Lankan vehicle market and automotive industry. Answer questions directly and concisely about vehicle trends, market conditions, and general automotive knowledge in Sri Lanka. Keep responses brief and focused."

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
