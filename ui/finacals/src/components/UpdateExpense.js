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
    unit_price: 0,
    amount: 0,
    really_needed: false,
    expense_type: null,
  });
  const [selectedExpenseTypeId, setSelectedExpenseTypeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    console.log('expenseId received:', id);
    if (id && !expenseData) {
        loadExpense(id);
    }
  }, [id, expenseData, loadExpense]);

  useEffect(() => {
    console.log('Expense data received:', expenseData);
    if (expenseData) {
      const { date, name, quantity_purchased, unit_price, amount, really_needed, expense_type } = expenseData.data;
      setFormData({
        date: date ? date.split("T")[0] : "" || "",
        name: name || "",
        quantity_purchased: quantity_purchased || 1,
        unit_price: unit_price || 0,
        amount: amount || 0,
        really_needed: really_needed || false,
        expense_type: expense_type?.id || null,
        //expenseId: expenseData.id
      });
    }
  }, [expenseData]);

    // Don't render the form until expenseData is available
    if (loading) {
        return <p>Loading...</p>; // Show a loading indicator
        }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleExpenseTypeChange = (typeId) => {
    setFormData((prev) => ({ ...prev, expense_type: typeId }));
    setSelectedExpenseTypeId(typeId);
    setErrors((prev) => ({ ...prev, expense_type: "" }));
  };

  const handleDateChange = (selectedDate) => {
    setFormData((prev) => ({ ...prev, date: selectedDate }));
    setErrors((prev) => ({ ...prev, date: "" }));
  };

  const handleCancel = () => {
    navigate("/");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.expense_type) newErrors.expense_type = "Select from expense category.";
    if (!formData.date) newErrors.date = "Date is required.";
    if (!formData.name) newErrors.name = "Product or service name is required.";
    if (formData.unit_price <= 0 && formData.amount <= 0) {
      newErrors.unit_price = "Unit price or amount must be greater than 0.";
      newErrors.amount = "Unit price or amount must be greater than 0.";
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

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
        // const updatedData = {
        //     ...expenseData, // Spread existing fields
        //     expense_type_id: selectedExpenseTypeId || expenseData?.expense_type?.id, // Use the selected ID or fallback
        //   };
      //await updateExpense(expenseData.data?.id, formData.expense_type, formData);
      const updatedData = {
        date: formData.date,
        name: formData.name,
        quantity_purchased: formData.quantity_purchased,
        unit_price: formData.unit_price,
        amount: formData.amount,
        really_needed: formData.really_needed,
        expense_type_id: selectedExpenseTypeId || formData.expense_type, // Ensure this is properly set
      };
      await updateExpense(expenseData.data?.id, updatedData);
      setSuccessMessage("Expense updated successfully!");
      
      navigate("/");
    } catch (err) {
        alert(err)
      setError("Failed to update expense.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Update Expense</h2>

      {error && <p className="text-red-500 mb-2">{error}</p>}
      {successMessage && <p className="text-green-500 mb-2">{successMessage}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Expense Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Expense Type
          </label>
          <ExpenseTypeist
            onExpenseTypeChange={handleExpenseTypeChange}
            selectedType={formData.expense_type}
          />
          {errors.expense_type && (
            <p className="text-red-500 text-sm">{errors.expense_type}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <DatePicker
            selectedDate={formData.date}
            onChange={handleDateChange}
          />
          {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Quantity Purchased
          </label>
          <input
            type="number"
            name="quantity_purchased"
            value={formData.quantity_purchased}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.quantity_purchased && (
            <p className="text-red-500 text-sm">{errors.quantity_purchased}</p>
          )}
        </div>

        {/* Unit Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Unit Price
          </label>
          <input
            type="number"
            name="unit_price"
            value={formData.unit_price}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Really Needed */}
        <div className="flex items-center space-x-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Really Needed?</label>
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="really_needed"
              value="true"
              onChange={handleInputChange}
              checked={formData.really_needed === true}
            />
            <span>Yes</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="really_needed"
              value="false"
              onChange={handleInputChange}
              checked={formData.really_needed === false}
            />
            <span>No</span>
          </label>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            {loading ? "Updating..." : "Update"}
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

export default UpdateExpenseForm;
