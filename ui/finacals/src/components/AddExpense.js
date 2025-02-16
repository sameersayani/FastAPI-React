import React, { useState } from "react";
import ExpenseTypeist from "./ExpenseType";
import DatePicker from "./DatePicker";
import { useNavigate } from "react-router-dom";

const AddExpenseForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    name: "",
    quantity_purchased: 1,
    unit_price: 0,
    amount: 0,
    really_needed: false,
    expense_type: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  
  const handleExpenseTypeChange = (typeId) => {
    setFormData((prev) => ({ ...prev, expense_type: typeId })); // Update expense_type in formData
    setErrors((prev) => ({ ...prev, expense_type: "" })); // Clear error
  };

  const handleDateChange = (selectedDate) => {
    setFormData({ ...formData, date: selectedDate });
    setErrors({ ...errors, date: "" }); // Clear error when date is selected
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "really_needed" ? value === "true" : value,
    }));
  };
  const handleRadioChange = (e) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      really_needed: value === "true", 
    });
    setErrors({ ...errors, really_needed: "" });
  };

  const handleCancel = () => {
    navigate("/");
  };

  const validateForm = () => {
    const newErrors = {};

    if(!formData.expense_type) newErrors.expense_type = "Select from expense category";
    if (!formData.date) newErrors.date = "Date is required.";
    if (!formData.name) newErrors.name = "Name of product or service purchased is required.";
    if (formData.unit_price <= 0 && formData.amount <= 0) {
      newErrors.unit_price = "Either unit price or amount must be greater than 0.";
      newErrors.amount = "Either unit price or amount must be greater than 0.";
    }
    if (formData.quantity_purchased <= 0) {
      newErrors.quantity_purchased = "Quantity must be greater than 0.";
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

    setErrors({});

    setError(null);
    setSuccessMessage("");
    setLoading(true);

    const { expense_type, ...payload } = formData;
    try {
      const response = await fetch(`http://127.0.0.1:8000/dailyexpense/${formData.expense_type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.log(JSON.stringify(payload))
        throw new Error("Failed to add expense.");
      }

      setSuccessMessage("Expense added successfully!");
      setFormData({
        date: "",
        name: "",
        quantity_purchased: 1,
        unit_price: 0,
        amount: 0,
        really_needed: false,
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Add New Expense</h2>

      {error && <p className="text-red-500 mb-2">{error}</p>}
      {successMessage && <p className="text-green-500 mb-2">{successMessage}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Expense Type Radio List */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Expense Type
          </label>
          <ExpenseTypeist onExpenseTypeChange={handleExpenseTypeChange} selectedType={formData.expense_type} />
          {errors.expense_type && (
          <p className="text-red-500 text-sm">{errors.expense_type}</p>
        )}
        </div>
        <DatePicker
        selectedDate={formData.date}
        onChange={handleDateChange}
        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
          errors.date ? "border-red-500" : ""
        }`} />
         {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Product / Service Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="quantity_purchased" className="block text-sm font-medium text-gray-700">
            Quantity Purchased
          </label>
          <input
            type="number"
            id="quantity_purchased"
            name="quantity_purchased"
            value={formData.quantity_purchased}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700">
            Unit Price
          </label>
          <input
            type="number"
            id="unit_price"
            name="unit_price"
            value={formData.unit_price}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.unit_price && (
          <p className="text-red-500 text-sm">{errors.unit_price}</p>
        )}
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Really need?</label>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="really_needed"
              value="true"
              onChange={handleRadioChange}
              checked={formData.really_needed === true}
              className="form-radio text-blue-500"
            />
            <span className="text-sm">Yes</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="really_needed"
              value={false}
              onChange={handleRadioChange}
              checked={formData.really_needed === false}
              className="form-radio text-red-500"
            />
            <span className="text-sm">No</span>
          </label>
        </div>
        </div>
        <div className="flex space-x-4">
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Saving..." : "Add Expense"}
        </button>
        <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-300 text-black px-4 py-2 rounded-md"
          >
            Cancel
          </button>
          </div>
      </form>
    </div>
  );
};

export default AddExpenseForm;
