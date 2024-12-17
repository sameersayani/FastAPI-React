from fastapi import FastAPI, APIRouter, HTTPException
from tortoise.contrib.fastapi import register_tortoise, HTTPNotFoundError
from models import (DailyExpenseUpdate, supplier_pydantic, supplier_pydantic_in, Supplier, 
                    product_pydantic, product_pydantic_in, Product,
                    expensetpye_pydantic, expensetpye_pydantic_in, ExpenseType,
                    daily_expense_pydantic, daily_expense_pydantic_in, DailyExpense, DailyExpenseWithExpenseType)
from fastapi.security import OAuth2PasswordBearer
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

#email
from typing import List
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import BaseModel, EmailStr
#from starlette.responses import JSONResponse

#dotenv
from dotenv import dotenv_values

#credentials
credentials = dotenv_values(".env")

#CORS
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from googleauth import router as google_auth_router
import os

class EmailSchema(BaseModel):
    email: List[EmailStr]

class EmailContent(BaseModel):
     message: str
     subject: str   

conf = ConnectionConfig(
    MAIL_USERNAME = credentials["USERNAME"],
    MAIL_PASSWORD = credentials["PASSWORD"],
    MAIL_FROM = credentials["EMAIL"],
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.ethereal.email",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

# Ensure SECRET_KEY is defined in your .env file
SECRET_KEY = os.getenv("SECRET_KEY", "1ab49bf5-efe3-4dd4-a24f-465391d2a1f6")
app = FastAPI()
# Add SessionMiddleware
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)
# Include the auth router
app.include_router(google_auth_router, prefix="/api", tags=["Authentication"])

#adding CORS urls
origins = [
     "http://127.0.0.1:8000",
     "http://localhost:8000"
     "http://localhost:3000"
]

#add middleware
app.add_middleware(
     CORSMiddleware,
     allow_origins = ["*"],
     allow_credentials = True,
     allow_methods = ["*"],
     allow_headers = ["*"]
)

templates = Jinja2Templates(directory="templates")

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
# GOOGLE_CLIENT_ID = credentials["GOOGLE_CLIENT_ID"]
# GOOGLE_CLIENT_SECRET = credentials["GOOGLE_CLIENT_SECRET"]
# GOOGLE_REDIRECT_URI = credentials["GOOGLE_REDIRECT_URI"]


# @app.get('/')
# def index():
#     return {"Msg": "for documentation, visit /docs"} 
@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(
        name="home.html",
        context={"request": request}
    )

@app.post('/supplier')
async def app_supplier(supplier_info: supplier_pydantic_in):
     supplier_obj = await Supplier.create(**supplier_info.dict(exclude_unset=True))
     response = await supplier_pydantic.from_tortoise_orm(supplier_obj)
     return {"status": "OK", "data" : response}

@app.get("/supplier")
async def get_all_supplier():
     response = await supplier_pydantic.from_queryset(Supplier.all())
     return {"status": "OK", "data" : response}

@app.get("/supplier/{supplier_id}")
async def get_specific_supplier(supplier_id: int):
     response = await supplier_pydantic.from_queryset_single(Supplier.get(id=supplier_id))
     return {"status": "OK", "data" : response}

@app.put("/supplier/{supplier_id}")
async def update_supplier(supplier_id: int, update_info: supplier_pydantic_in):
     supplier =  await Supplier.get(id=supplier_id)
     update_info = update_info.dict(exclude_unset=True)
     supplier.name = update_info['name']
     supplier.company = update_info['company']
     supplier.phone = update_info['phone']
     supplier.email = update_info['email']
     response = await supplier_pydantic.from_tortoise_orm(supplier)
     return {"status": "OK", "data" : response} 

@app.delete("/supplier/{supplier_id}")
async def delete_supplier(supplier_id: int):
     await Supplier.filter(id=supplier_id).delete()
     return {"status": "OK"} 

@app.post('/product/{supplier_id}')
async def add_product(supplier_id: int, product_details: product_pydantic_in):
    supplier = await Supplier.get(id = supplier_id)
    product_details = product_details.dict(exclude_unset = True)
    product_details["revenue"] = product_details["quantity_sold"] * product_details["unit_price"]
    product_obj = await Product.create(**product_details, supplied_by = supplier)
    response = await product_pydantic.from_tortoise_orm(product_obj)
    return {"status": "OK", "data": response} 

@app.get('/product')
async def all_products():
     response = await product_pydantic.from_queryset(Product.all())
     return {"status": "OK", "data": response}

@app.get('/product/{id}')
async def specific_product(id: int):
     response = await product_pydantic.from_queryset_single(Product.get(id = id))
     return {"status": "OK", "data": response}

@app.put('/product/{id}')
async def update_product(id: int, update_info: product_pydantic_in):
     product = await Product.get(id=id)
     update_info = update_info.dict(exclude_unset=True)
     product.name = update_info['name']
     product.quantity_in_stock = update_info['quantity_in_stock']
     product.revenue =  int(update_info['quantity_sold']) * float(update_info['unit_price'])
     product.quantity_sold += int(update_info['quantity_sold'])
     product.unit_price = update_info['unit_price']
     await product.save()
     response = await product_pydantic.from_tortoise_orm(product)
     return {"status": "OK", "data": response}

@app.delete("/product/{id}")
async def delete_product(id: int):
     await Product.filter(id=id).delete()
     return {"status": "OK"} 


@app.post("/email/{product_id}")
async def send_email(product_id: int, content: EmailContent):
    product = await Product.get(id = product_id)
    supplier = await product.supplied_by
    supplier_email = [supplier.email]

    html = f"""
    <h5>Business Email</h5>
    <br/>
    <p>{content.message}</p>
    <br/>
    <h6>Best Regards</h6>
    <h6>John S</h6>  
    """
    message = MessageSchema(
        subject=content.subject,
        recipients=supplier_email,
        body=html,
        subtype=MessageType.html)

    fm = FastMail(conf)
    await fm.send_message(message)
    # return JSONResponse(status_code=200, content={"message": "email has been sent"}) 
    return {"status": "OK"}

@app.get("/expensetype")
async def get_expensetype():
     response = await expensetpye_pydantic.from_queryset(ExpenseType.all().order_by("name", "name"))
     return {"status": "OK", "data" : response}

@app.get("/expensetype/{expensetype_id}")
async def get_expensetype_by_id(expensetype_id: int):
     response = await expensetpye_pydantic.from_queryset_single(ExpenseType.filter(id=expensetype_id).first())
     return {"status": "OK", "data" : response}

@app.post('/expensetype')
async def app_expensetype(expensetype_info: expensetpye_pydantic_in):
     expensetype_obj = await ExpenseType.create(**expensetype_info.dict(exclude_unset=True))
     response = await expensetpye_pydantic.from_tortoise_orm(expensetype_obj)
     return {"status": "OK", "data" : response}

router = APIRouter() 
@app.put("/expensetype/{expensetype_id}")
async def update_expensetype(expensetype_id: int, update_info: expensetpye_pydantic_in):
     expensetype =  await ExpenseType.get(id=expensetype_id)
     update_info = update_info.dict(exclude_unset=True)
     expensetype.name = update_info['name']
     await expensetype.save()
     response = await expensetpye_pydantic.from_tortoise_orm(expensetype)
     return {"status": "OK", "data" : response} 

@app.delete("/expensetype/{expensetype_id}")
async def delete_expensetype(expensetype_id: int):
     await ExpenseType.filter(id=expensetype_id).delete()
     return {"status": "OK"} 

@app.get('/dailyexpense')
async def all_expenses():
     expenses = DailyExpense.all().prefetch_related('expense_type')
     response = await DailyExpenseWithExpenseType.from_queryset(expenses)
     return {"status": "OK", "data": response}

@app.get('/dailyexpense/{id}')
async def specific_expense(id: int):
     expense = await DailyExpense.get(id=id).select_related('expense_type')
     response = await DailyExpenseWithExpenseType.from_tortoise_orm(expense)
     return {"status": "OK", "data": response}

@app.delete("/dailyexpense/{dailyexpense_id}")
async def delete_expense(dailyexpense_id: int):
     await DailyExpense.filter(id=dailyexpense_id).delete()
     return {"status": "OK"} 

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

@app.put("/dailyexpense/{expense_id}")
async def update_daily_expense(expense_id: int, expense: DailyExpenseUpdate):
    db_expense = await DailyExpense.get_or_none(id=expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

#     formatted_date = expense.date.strftime("%Y-%m-%d")
    # Update fields, including expense_type_id
    print(f"Expense: {expense}")
    db_expense.date = expense.date
    db_expense.name = expense.name
    db_expense.quantity_purchased = expense.quantity_purchased
    db_expense.unit_price = expense.unit_price
    db_expense.amount = expense.amount
    db_expense.really_needed = expense.really_needed
    db_expense.expense_type_id = expense.expense_type_id  # Update the foreign key

    await db_expense.save()
    return db_expense

# Override Swagger UI to include OAuth2 settings
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title="Custom Swagger with Google OAuth2",
        oauth2_redirect_url="http://127.0.0.1:8000/api/auth/callback",
    )

# Include the OpenAPI redirect route for Swagger OAuth2
@app.get("/oauth2-redirect", include_in_schema=False)
async def oauth2_redirect():
    return {"message": "Swagger OAuth2 Redirect"}

register_tortoise(
    app,
    db_url="sqlite://database.sqlite3",
    modules={"models" : ["models"]},
    generate_schemas=True,
    add_exception_handlers=True
)
