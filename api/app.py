from collections import defaultdict
from datetime import datetime
from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.encoders import jsonable_encoder
from tortoise.contrib.fastapi import register_tortoise
from models import (
    DailyExpenseUpdate,
    expensetpye_pydantic, expensetpye_pydantic_in, ExpenseType,
    daily_expense_pydantic, daily_expense_pydantic_in,
    DailyExpense, DailyExpenseWithExpenseType
)
from fastapi.security import OAuth2PasswordBearer
from starlette.requests import Request
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from dotenv import dotenv_values
from typing import List, Optional
import os
from authlib.integrations.starlette_client import OAuth, OAuthError
from googleauth import router as google_auth_router

# Load environment variables
credentials = dotenv_values(".env")

# Initialize FastAPI app
app = FastAPI()

# Middleware for sessions
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "default_secret_key"), https_only=False)

# Include authentication router
app.include_router(google_auth_router, prefix="/api", tags=["Authentication"])

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 Google Authentication
oauth = OAuth()
oauth.register(
    "google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    authorize_url="https://accounts.google.com/o/oauth2/auth",
    access_token_url="https://oauth2.googleapis.com/token",
    client_kwargs={"scope": "email profile"},
)

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
        return JSONResponse(content={"status": "OK", "data": filtered_expenses})

    return JSONResponse(content={"status": "OK", "data": response_list})

@app.get('/dailyexpense/{id}')
async def specific_expense(id: int):
    expense = await DailyExpense.get_or_none(id=id).select_related('expense_type')
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    expense_data = await DailyExpenseWithExpenseType.from_tortoise_orm(expense)

    # ✅ Convert Pydantic model to JSON-safe format
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

# Database Registration
register_tortoise(
    app,
    db_url="sqlite://database.sqlite3",
    modules={"models": ["models"]},
    generate_schemas=True,
    add_exception_handlers=True
)
