import pandas as pd
from typing import Dict, List, Any

def compute_insights(df: pd.DataFrame) -> Dict[str, Any]:
    insights = {}

    # 1. Top manufacturers by sales count (Bar chart: x=Manufacturer, y=Count)
    if 'Manufacturer' in df.columns:
        manufacturer_counts = df.groupby('Manufacturer').size().reset_index(name='Count')
        insights['manufacturer_sales'] = manufacturer_counts.to_dict('records')

    # 2. Highest average profit by manufacturer (Bar chart: x=Manufacturer, y=Avg_Profit)
    if 'Manufacturer' in df.columns and 'Price_LKR' in df.columns and 'Cost_of_Dealership' in df.columns and 'Cost_Price_LKR' in df.columns:
        # Calculate profit for each vehicle
        df['Profit_LKR'] = df['Price_LKR'] - (df['Cost_of_Dealership'] + df['Cost_Price_LKR'])
        avg_profit = df.groupby('Manufacturer')['Profit_LKR'].mean().reset_index(name='Avg_Profit')
        avg_profit['Avg_Profit'] = avg_profit['Avg_Profit'].astype(int)
        insights['manufacturer_profit'] = avg_profit.to_dict('records')

    # 3. Fuel type trends (Pie chart: Fuel type vs Count or Sum Profit)
    if 'Fuel type' in df.columns:
        fuel_counts = df.groupby('Fuel type').size().reset_index(name='Count')
        insights['fuel_sales'] = fuel_counts.to_dict('records')

    # 4. Average selling price over manufacture years (Line chart: x=Year, y=Avg_Price)
    if 'Year of manufacture' in df.columns and 'Price_LKR' in df.columns:
        price_trend = df.groupby('Year of manufacture')['Price_LKR'].mean().reset_index(name='Avg_Price')
        insights['price_trend'] = price_trend.to_dict('records')

    # 5. Mileage impact on price (Scatter plot: x=Mileage, y=Price_LKR)
    if 'Mileage' in df.columns and 'Price_LKR' in df.columns:
        mileage_price = df[['Mileage', 'Price_LKR']].dropna()
        insights['mileage_price'] = mileage_price.to_dict('records')

    # 6. Time to sell (Histogram: Holding_Days)
    if 'Holding_Days' in df.columns:
        holding_days = df['Holding_Days'].dropna()
        # For histogram, provide binned data or raw values
        insights['holding_days'] = holding_days.tolist()

    # 7. Cost structure per manufacturer (Grouped bar: Manufacturer, Avg_Cost, Avg_Price)
    if 'Manufacturer' in df.columns and 'Cost_Price_LKR' in df.columns and 'Price_LKR' in df.columns:
        cost_price = df.groupby('Manufacturer')[['Cost_Price_LKR', 'Price_LKR']].mean().reset_index()
        insights['cost_structure'] = cost_price.to_dict('records')

    # 8. Sales volume over time (Line chart: x=Month, y=Count)
    if 'Sold_Date' in df.columns:
        df['Sold_Date'] = pd.to_datetime(df['Sold_Date'], errors='coerce')
        sales_over_time = df.groupby(df['Sold_Date'].dt.to_period('M')).size().reset_index(name='Count')
        sales_over_time['Month'] = sales_over_time['Sold_Date'].astype(str)
        insights['sales_volume'] = sales_over_time[['Month', 'Count']].to_dict('records')

    # 9. Owner count analysis (Box plot: Number_of_Owners vs Price/Profit)
    if 'Number_of_Owners' in df.columns:
        if 'Price_LKR' in df.columns:
            owner_price = df.groupby('Number_of_Owners')['Price_LKR'].describe().reset_index()
            insights['owner_price'] = owner_price.to_dict('records')
        if 'Profit_LKR' in df.columns:
            owner_profit = df.groupby('Number_of_Owners')['Profit_LKR'].describe().reset_index()
            insights['owner_profit'] = owner_profit.to_dict('records')

    # 10. Engine size vs price (Scatter plot: x=Engine size, y=Price_LKR)
    if 'Engine size' in df.columns and 'Price_LKR' in df.columns:
        engine_price = df[['Engine size', 'Price_LKR']].dropna()
        insights['engine_price'] = engine_price.to_dict('records')

    # Summary statistics
    summary = {}
    summary['total_vehicles'] = len(df)

    # Calculate total_profit as sum of (Price_LKR - (Cost_of_Dealership + Cost_Price_LKR))
    if 'Price_LKR' in df.columns and 'Cost_of_Dealership' in df.columns and 'Cost_Price_LKR' in df.columns:
        summary['total_profit'] = (df['Price_LKR'] - (df['Cost_of_Dealership'] + df['Cost_Price_LKR'])).sum()

    if 'Price_LKR' in df.columns:
        summary['avg_selling_price'] = df['Price_LKR'].mean()

    # Calculate avg_holding_days as average of (Sold_Date - Bought_Date) in days
    if 'Bought_Date' in df.columns and 'Sold_Date' in df.columns:
        holding_days = (pd.to_datetime(df['Sold_Date']) - pd.to_datetime(df['Bought_Date'])).dt.days
        summary['avg_holding_days'] = int(holding_days.mean())

    if 'Manufacturer' in df.columns:
        mode_manufacturer = df['Manufacturer'].mode()
        if not mode_manufacturer.empty:
            summary['most_sold_manufacturer'] = mode_manufacturer[0]
    insights['summary'] = summary

    return insights
