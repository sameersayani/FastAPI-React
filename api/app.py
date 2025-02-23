from collections import defaultdict
from datetime import datetime
import io
import json
from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends, Response, requests
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.encoders import jsonable_encoder
from fastapi.templating import Jinja2Templates
from tortoise.contrib.fastapi import register_tortoise
from models import (
    DailyExpenseUpdate,
    expensetpye_pydantic, expensetpye_pydantic_in, ExpenseType,
    daily_expense_pydantic, daily_expense_pydantic_in,
    DailyExpense, DailyExpenseWithExpenseType
)
from starlette.requests import Request
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from dotenv import dotenv_values
from typing import List, Optional
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth, OAuthError
from api.config import CLIENT_ID, CLIENT_SECRET
from fastapi.staticfiles import StaticFiles
import os
import openpyxl
from tortoise.expressions import Q

# Initialize FastAPI app
app = FastAPI()

# Middleware for sessions
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "default_secret_key"), https_only=False)
app.mount("/static", StaticFiles(directory="static"), name="static")

oauth = OAuth()
oauth.register(
    name='google',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    client_kwargs={
        'scope': 'email openid profile',
        # 'redirect_url': 'http://localhost:8000/auth'
    }
)

# # CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="templates")

@app.get("/")
def index(request: Request):
    user = request.session.get('user')
    if user:
        return RedirectResponse('welcome')

    return templates.TemplateResponse(
        name="home.html",
        context={"request": request}
    )

@app.get('/welcome')
def welcome(request: Request):
    user = request.session.get('user')
    if not user:
        return RedirectResponse('/')
    return templates.TemplateResponse(
        name='welcome.html',
        context={'request': request, 'user': user}
    )

@app.get("/login")
async def login(request: Request):
    url = request.url_for('auth')
    return await oauth.google.authorize_redirect(request, url)

@app.get('/auth')
async def auth(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as e:
        return templates.TemplateResponse(
            name='error.html',
            context={'request': request, 'error': e.error}
        )
    
    user = token.get('userinfo')
    if user:
        request.session['user'] = dict(user)

    return RedirectResponse("http://127.0.0.1:3000/")

@app.get("/user")
def get_user(request: Request):
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return JSONResponse(content={"user": user})

@app.get('/logout')
def logout(request: Request):
    request.session.pop('user')
    request.session.clear()
    return RedirectResponse('/')

# Health Check
@app.get("/api/health")
def health_check():
    return {"status": "API is working!"}

# Expense Type Endpoints
@app.get("/expensetype")
async def get_expensetype():
    query = ExpenseType.all().order_by("name")  # Don't await here
    response = await expensetpye_pydantic.from_queryset(query)  # Await here instead
    return response

@app.get("/expensetype/{expensetype_id}")
async def get_expensetype_by_id(expensetype_id: int):
    response = await ExpenseType.get_or_none(id=expensetype_id)
    if not response:
        raise HTTPException(status_code=404, detail="Expense type not found")
    return JSONResponse(content=jsonable_encoder(await expensetpye_pydantic.from_tortoise_orm(response)))

@app.post('/expensetype')
async def add_expensetype(expensetype_info: expensetpye_pydantic_in):
    expensetype_obj = await ExpenseType.create(**expensetype_info.dict(exclude_unset=True))
    return JSONResponse(content=jsonable_encoder(await expensetpye_pydantic.from_tortoise_orm(expensetype_obj)))

@app.delete("/expensetype/{expensetype_id}")
async def delete_expensetype(expensetype_id: int):
    deleted_count = await ExpenseType.filter(id=expensetype_id).delete()
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense type not found")
    return {"status": "OK"}

# Daily Expense Endpoints
@app.get('/dailyexpense')
async def all_expenses(month: Optional[int] = None, year: Optional[int] = None):
    query = DailyExpense.all().prefetch_related('expense_type')  
    response = await DailyExpenseWithExpenseType.from_queryset(query)
    response_list = jsonable_encoder(response)

    if month and year:
        filtered_expenses = [
            expense for expense in response_list
            if expense.get("date") and
               datetime.fromisoformat(expense["date"].replace("Z", "")).month == month and
               datetime.fromisoformat(expense["date"].replace("Z", "")).year == year
        ]
    else:
        filtered_expenses = response_list

    # Ensure amount is always a float
    total_expenditure = sum(float(expense.get("amount") or 0) for expense in filtered_expenses)

    # Filter and sum non-essential expenses
    non_essential_expenditure = sum(
        float(expense.get("amount") or 0) for expense in filtered_expenses if not expense.get("really_needed", False)
    )

    # Essential expenditure = total - non-essential
    essential_expenditure = total_expenditure - non_essential_expenditure

    return JSONResponse(content={
        "status": "OK",
        "actual_total_expenditure": format_indian_currency(total_expenditure),  # Ensure this function handles numbers
        "non_essential_expenditure": format_indian_currency(non_essential_expenditure),
        "essential_expenditure": format_indian_currency(essential_expenditure),
        "data": filtered_expenses
    })

@app.get('/dailyexpense/{id}')
async def specific_expense(id: int):
    expense = await DailyExpense.get_or_none(id=id).select_related('expense_type')
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    expense_data = await DailyExpenseWithExpenseType.from_tortoise_orm(expense)

    # ✅ Convert Pydantic model to JSON-safe format
    return JSONResponse(content={"status": "OK", "data": jsonable_encoder(expense_data)})

@app.get("/search-expense/{name}")
async def search_expense_by_product(name: str):
    if len(name) < 3:
        raise HTTPException(status_code=400, detail="Product name must be at least 4 characters long")

    expenses = await DailyExpense.filter(Q(name__icontains=name)).select_related("expense_type")

    if not expenses:
        raise HTTPException(status_code=404, detail="No matching expenses found")

    expense_data = [await DailyExpenseWithExpenseType.from_tortoise_orm(expense) for expense in expenses]

    return JSONResponse(content={"status": "OK", "data": jsonable_encoder(expense_data)})

@app.post('/dailyexpense/{expensetype_id}')
async def add_expense(expensetype_id: int, expense_details: daily_expense_pydantic_in):
    expense_type = await ExpenseType.get(id = expensetype_id)
    expense_details = expense_details.dict(exclude_unset = True)
    if expense_details["unit_price"] > 0 and expense_details["amount"] == 0: 
       expense_details["amount"] = expense_details["quantity_purchased"] * expense_details["unit_price"]
    elif expense_details["amount"] > 0 and expense_details["unit_price"] == 0:
       expense_details["amount"] = expense_details["amount"]
    expense_obj = await DailyExpense.create(**expense_details, expense_type = expense_type)
    response = await daily_expense_pydantic.from_tortoise_orm(expense_obj)
    return {"status": "OK", "data": response}
    
@app.delete("/dailyexpense/{dailyexpense_id}")
async def delete_expense(dailyexpense_id: int):
    deleted_count = await DailyExpense.filter(id=dailyexpense_id).delete()
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"status": "OK", "message": "Expense deleted", "data": None}

@app.put("/dailyexpense/{expense_id}")
async def update_daily_expense(expense_id: int, expense: DailyExpenseUpdate):
    db_expense = await DailyExpense.get_or_none(id=expense_id)
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    for key, value in expense.dict(exclude_unset=True).items():
        setattr(db_expense, key, value)

    await db_expense.save()
    updated_expense = await daily_expense_pydantic.from_tortoise_orm(db_expense)

    return JSONResponse(content={"status": "OK", "data": jsonable_encoder(updated_expense)})

## charts
@app.get("/chart-data")
async def get_chart_data(month: Optional[int] = None, year: Optional[int] = None):
    query = DailyExpense.all().prefetch_related('expense_type')  
    response = await DailyExpenseWithExpenseType.from_queryset(query)
    response_list = jsonable_encoder(response)

    if month and year:
        filtered_expenses = [
            expense for expense in response_list
            if expense.get("date") and
               datetime.fromisoformat(expense["date"].replace("Z", "")).month == month and
               datetime.fromisoformat(expense["date"].replace("Z", "")).year == year
        ]
     # Group data
    grouped_data = defaultdict(lambda: defaultdict(list))
    for expense in filtered_expenses:
        # Convert object to dictionary
        expense_dict = dict(expense)

        # Convert date to ISO format string if needed
        raw_date = expense_dict['date']
        if isinstance(raw_date, datetime):
            raw_date = raw_date.isoformat()
        expense_dict['date'] = raw_date

        # Extract Year/Month and Expense Type
        date = datetime.fromisoformat(raw_date).date()
        year_month = date.strftime("%B %Y")  # Format as "Month Year" #f"{date.year}-{date.month:02d}"
        expense_type = expense_dict['expense_type']['name']

        ## Append expense to grouped structure
        #grouped_data[year_month][expense_type].append(expense_dict)

        filtered_expense = {
            "name": expense_dict['name'],
            "amount": expense_dict['amount'],
            "really_needed": expense_dict['really_needed'],
        }
        grouped_data[year_month][expense_type].append(filtered_expense)
       

     # Transform defaultdict to regular dict for JSON serialization
    grouped_dict = {
          year_month: {
               expense_type: expenses
               for expense_type, expenses in types.items()
          }
          for year_month, types in grouped_data.items()
     }

    return JSONResponse(content={"data": grouped_dict}) 

    # Example data
#     data = {
#         "labels": ["January", "February", "March", "April"],
#         "barValues": [500, 700, 800, 600],
#         "pieValues": [200, 300, 500],
#         "lineValues": [400, 500, 450, 600],
#     }

@app.get('/download-report', response_class=Response)
async def download_expense_report(
    month: Optional[int] = Query(None), 
    year: Optional[int] = Query(...)
):
    """
    Generates an Excel (XLSX) report of expenses for the given month and year.
    - If month is provided, it generates a **monthly report**.
    - If month is omitted, it generates a **yearly report**.
    """

    # Fetch all expenses
    query = DailyExpense.all().prefetch_related("expense_type")
    response = await DailyExpenseWithExpenseType.from_queryset(query)
    response_list = jsonable_encoder(response)

    # Filter based on month & year 
    filtered_expenses = [
        expense for expense in response_list
        if expense.get("date") and
           datetime.fromisoformat(expense["date"].replace("Z", "")).year == year and
           (month is None or datetime.fromisoformat(expense["date"].replace("Z", "")).month == month)
    ]

    if not filtered_expenses:
        return JSONResponse(content={"status": "ERROR", "message": "No expenses found for the given period"})

    # Create an Excel workbook and worksheet
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = f"Expenses_{year}_{month if month else 'FullYear'}"

    # Add headers
    headers = ["Date", "Category", "Amount"]
    ws.append(headers)

    # Ensure that amount is never None, defaulting to 0
    total_expenditure = sum(expense.get("amount") or 0 for expense in filtered_expenses)

    # Ensure that expenses without "really_needed" default to False
    non_essential_expenditure = sum(
        (expense.get("amount") or 0) for expense in filtered_expenses if not expense.get("really_needed", False)
    )

    # Essential expenditure (all expenses - non-essential expenses)
    essential_expenditure = total_expenditure - non_essential_expenditure

    # Add data to worksheet
    for expense in filtered_expenses:
        ws.append([
            expense["date"].replace("T00:00:00Z",""),
            expense["expense_type"]["name"],  # Assuming expense_type has a "name" field
            expense["amount"]
        ])

    # Insert empty row before totals
    ws.append([])

    # Add totals
    ws.append(["", "Actual Total Expenditure", total_expenditure])
    ws.append(["", "Non-Essential Expenditure", non_essential_expenditure])
    ws.append(["", "Desired Essential Expenditure", essential_expenditure])

    # Save to an in-memory buffer
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    # Prepare response with Excel data
    filename = f"expenses_{year}_{month if month else 'full_year'}.xlsx"
    response = Response(content=output.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"

    return response

@app.delete('/delete-expenses')
async def delete_expenses(
    month: Optional[int] = Query(None), 
    year: Optional[int] = Query(...)
):
    """
    Deletes expenses for the given month and year.
    - If month is provided, it deletes the **monthly records**.
    - If month is omitted, it deletes the **entire year's records**.
    """
    
    if year is None:
        return JSONResponse(content={"status": "ERROR", "message": "Year is required"}, status_code=400)

    # Create a filter condition for the year (and optionally for the month)
    query_filter = Q(date__startswith=f"{year}-")
    if month:
        query_filter &= Q(date__startswith=f"{year}-{str(month).zfill(2)}")

    # Count the number of records before deletion
    count = await DailyExpense.filter(query_filter).count()

    if count == 0:
        return JSONResponse(content={"status": "ERROR", "message": "No records found to delete"}, status_code=404)

    # Perform deletion
    await DailyExpense.filter(query_filter).delete()

    return JSONResponse(content={"status": "OK", "message": f"Deleted {count} records successfully"})

def format_indian_currency(amount):
    amount_str = f"{amount:,}"  # Default formatting with commas
    parts = amount_str.split(",")

    # Apply Indian number formatting
    if len(parts) > 1:
        return parts[0] + "," + ",".join(parts[1:]).replace(",", "")

    return amount_str

# Database Registration
register_tortoise(
    app,
    db_url="sqlite://database.sqlite3",
    modules={"models": ["models"]},
    generate_schemas=True,
    add_exception_handlers=True
)
