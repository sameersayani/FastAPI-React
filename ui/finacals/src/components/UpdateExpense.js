import React, { useEffect, useState } from "react";
import { useUpdateExpenseContext } from "../UpdateExpenseContext";
import ExpenseTypeist from "./ExpenseType";
import DatePicker from "./DatePicker";
import { useNavigate } from "react-router-dom";

const UpdateExpenseForm = ({ id, onCancel }) => {
  const navigate = useNavigate();
  const { expenseData, loadExpense, updateExpense } = useUpdateExpenseContext();
  const [formData, setFormData] = useState({
    date: "",
    name: "",
    quantity_purchased: 1,
    unit_price: "",
    amount: "",
    really_needed: false,
    expense_type: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (id) {
      loadExpense(id);
    }
  }, [id, loadExpense]);

  useEffect(() => {
    if (expenseData && expenseData.data) {
      const { date, name, quantity_purchased, unit_price, amount, really_needed, expense_type } = expenseData.data;
      setFormData({
        date: date ? date.split("T")[0] : "",
        name: name || "",
        quantity_purchased: quantity_purchased || 1,
        unit_price: unit_price !== null ? unit_price : "",
        amount: amount !== null ? amount : "",
        really_needed: really_needed || false,
        expense_type: expense_type.id || null,
      });
    }
  }, [expenseData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "really_needed" ? value === "true" : value,
    }));
  };

  const handleExpenseTypeChange = (typeId) => {
    setFormData((prev) => ({ ...prev, expense_type: typeId }));
    setErrors((prev) => ({ ...prev, expense_type: "" }));
  };

  const handleDateChange = (selectedDate) => {
    setFormData((prev) => ({ ...prev, date: selectedDate }));
    setErrors((prev) => ({ ...prev, date: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    const unitPrice = String(formData.unit_price).trim() === "" ? 0 : parseFloat(formData.unit_price);
    const amount = String(formData.amount).trim() === "" ? 0 : parseFloat(formData.amount);

    if (!formData.expense_type) newErrors.expense_type = "Select an expense category";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.name) newErrors.name = "Product/service name is required";
    if (unitPrice > 0 && amount > 0) {
      newErrors.unit_price = "Please either enter unit price or amount. If you enter unit price, amount will auto-calculate";
    }
    if (unitPrice <= 0 && amount <= 0) {
      newErrors.amount = "Either unit price or amount must be greater than 0";
    }
    if (formData.quantity_purchased <= 0) {
      newErrors.quantity_purchased = "Quantity must be greater than 0";
    }
    if(formData.unit_price === ""){
      formData.unit_price = 0;
    }
    if(formData.amount === ""){
      formData.amount = 0;
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const updatedData = {
        date: formData.date,
        name: formData.name,
        quantity_purchased: formData.quantity_purchased,
        unit_price: formData.unit_price || 0,
        amount: formData.amount || 0,
        really_needed: formData.really_needed,
        expense_type_id: formData.expense_type,
      };
      await updateExpense(expenseData.data?.id, updatedData);
      setSuccessMessage("Expense updated successfully!");
      navigate("/");
    } catch (err) {
      setError("Failed to update expense.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Update Expense</h2>
      {typeof error === "string" && <p className="text-red-500 text-sm mb-2">{error}</p>}
      {Object.values(errors).map((err, index) => (
        <p key={index} className="text-red-500 text-sm mb-2"><strong>{err}</strong></p>
      ))}
      {successMessage && <p className="text-green-500 text-sm mb-2">{successMessage}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <ExpenseTypeist onExpenseTypeChange={handleExpenseTypeChange} selectedType={formData.expense_type} />
        <DatePicker selectedDate={formData.date} onChange={handleDateChange} />
        <input type="text" name="name" placeholder="Product / Service Name" value={formData.name} onChange={handleInputChange} className="w-full p-3 border rounded-md" />
        <input type="number" name="quantity_purchased" placeholder="Quantity" value={formData.quantity_purchased} onChange={handleInputChange} className="w-full p-3 border rounded-md" />
        <input type="number" name="unit_price" placeholder="Unit Price" value={formData.unit_price} onChange={handleInputChange} className="w-full p-3 border rounded-md" />
        <input type="number" name="amount" placeholder="Amount" value={formData.amount} onChange={handleInputChange} className="w-full p-3 border rounded-md" />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">{loading ? "Updating..." : "Update Expense"}</button>
        <span className="mx-4 space-y-4">&nbsp;</span>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="bg-gray-400 text-white px-6 py-2 rounded-md hover:bg-gray-500"
        > 
          Cancel
        </button>
        {typeof error === "string" && <p className="text-red-500 text-sm mb-2">{error}</p>}
      {Object.values(errors).map((err, index) => (
        <p key={index} className="text-red-500 text-sm mb-2"><strong>{err}</strong></p>
      ))}
      {successMessage && <p className="text-green-500 text-sm mb-2">{successMessage}</p>}
      </form>
    </div>
  );
};

export default UpdateExpenseForm;
