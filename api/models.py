from tortoise.models import Model
from tortoise import fields
from tortoise.contrib.pydantic import pydantic_model_creator

class Product(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=30, nullable=False)
    quantity_in_stock = fields.IntField(default = 0)
    quantity_sold = fields.IntField(default = 0)
    unit_price = fields.FloatField(max_digits=8, decimal_places=2, default=0.00)
    revenue = fields.FloatField(max_digits=20, decimal_places=2, default=0.00)
    supplied_by = fields.ForeignKeyField('models.Supplier', 
                                         related_name="goods_supplier")
    
class Supplier(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100)
    company = fields.CharField(max_length=100)
    email = fields.CharField(max_length=100)
    phone = fields.CharField(max_length=20)

class ExpenseType(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100)

class DailyExpense(Model):
    id = fields.IntField(pk=True)
    date = fields.DatetimeField(nullable=False)
    name = fields.CharField(max_length=200, nullable=False)
    quantity_purchased = fields.IntField(default = 1)
    unit_price = fields.FloatField(max_digits=8, decimal_places=2, default=0.00)
    amount = fields.FloatField(max_digits=8, decimal_places=2, default=0.00)
    really_needed = fields.BooleanField(default = False)
    expense_type = fields.ForeignKeyField('models.ExpenseType', 
                                         related_name="typeof_expense")
    
#create pydantic models
product_pydantic = pydantic_model_creator(Product, name="Product")
product_pydantic_in = pydantic_model_creator(Product, name="ProductIn", exclude_readonly=True)

supplier_pydantic = pydantic_model_creator(Supplier, name="Supplier")
supplier_pydantic_in = pydantic_model_creator(Supplier, name="SupplierIn", exclude_readonly=True)

expensetpye_pydantic = pydantic_model_creator(ExpenseType, name="ExpenseType")
expensetpye_pydantic_in = pydantic_model_creator(ExpenseType, name="ExpenseTypeIn", exclude_readonly=True)

# Create Pydantic model for DailyExpense, including expense_type as a nested model
daily_expense_pydantic = pydantic_model_creator(
    DailyExpense, 
    name="DailyExpense",
    include=("id", "date", "name", "quantity_purchased", "unit_price", "amount", "really_needed", "expense_type")
)

# Input model for creation or update (exclude readonly fields)
daily_expense_pydantic_in = pydantic_model_creator(
    DailyExpense, 
    name="DailyExpenseIn", 
    exclude_readonly=True
)

class DailyExpenseWithExpenseType(daily_expense_pydantic):
    expense_type: expensetpye_pydantic   
