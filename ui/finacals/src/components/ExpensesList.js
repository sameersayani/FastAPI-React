import React, { useEffect, useContext, useState } from "react";
import { Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ExpenseTypeContext } from "../ExpenseTypeContext";
import { ExpenseContext } from "../ExpenseContext";
import ExpenseRow from "./Expenses";
import { useUpdateExpenseContext } from "../UpdateExpenseContext";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

const ExpensesList = () => {
  const [expenseType, setExpenseType] = useContext(ExpenseTypeContext);
  const [expenses, setExpenses] = useContext(ExpenseContext);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const { loadExpense } = useUpdateExpenseContext(); // Use loadExpense from the context
  const [isModalOpen, setIsModalOpen] = useState(false);
  
    // Initialize current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Months are 0-indexed
    const currentYear = currentDate.getFullYear();
  
    const [filters, setFilters] = useState({ month: currentMonth, year: currentYear });
  

  let navigate = useNavigate();

  const openModal = (expenseId) => {
    const expense = expenses.data.find((expense) => expense.id === expenseId);
    setExpenseToDelete(expense);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setExpenseToDelete(null);
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/dailyexpense?month=${filters.month}&year=${filters.year}`
      );
      const result = await response.json();
      setExpenses({ data: [...result.data] });
    } catch (error) {
      console.error("Error fetching filtered expenses:", error);
    }
  };
  
  const handleDelete = () => {
    if (!expenseToDelete) return;

    fetch(`http://127.0.0.1:8000/dailyexpense/${expenseToDelete.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.status === "OK") {
          const updatedExpenses = expenses.data.filter(
            (expense) => expense.id !== expenseToDelete.id
          );
          setExpenses({ ...expenses, data: updatedExpenses });
        } else {
          alert("Failed to delete the expense !");
        }
      })
      .catch((error) => console.error("Error:", error))
      .finally(() => {
        closeModal(); // Close the modal after operation
      });
  };

  const handleUpdate = (id) => {
    // Load the selected expense data by ID
    loadExpense(id); // Use loadExpense to populate the context with the data
    navigate(`/updateexpense/${id}`); // Navigate to the Update Expense page
  };

  const fetchExpenses = () => {
    const queryParams = new URLSearchParams();

    if (filters.month) queryParams.append("month", filters.month);
    if (filters.year) queryParams.append("year", filters.year);

    fetch(`http://127.0.0.1:8000/dailyexpense?${queryParams.toString()}`)
      .then((response) => response.json())
      .then((result) => {
        setExpenses({ data: [...result.data] });
      })
      .catch((error) => console.error("Error fetching expenses:", error));
  };

  // useEffect(() => {
  //   fetch("http://127.0.0.1:8000/dailyexpense")
  //     .then((response) => {
  //       return response.json();
  //     })
  //     .then((result) => {
  //       setExpenses({ data: [...result.data] });
  //     });
  // }, []);
  
  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-1">
    {/* Filter Section */}
    <div className="flex flex-col items-start space-y-4 mb-6">
    <div className="p-1">
    <div className="flex items-center space-x-4 mb-4">
      <div>
        <label htmlFor="month" className="block text-sm font-medium text-gray-700">
          Month
        </label>
        <select
          id="month"
          value={filters.month}
          onChange={(e) =>
            setFilters({ ...filters, month: parseInt(e.target.value) })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {Array.from({ length: 12 }, (_, index) => (
            <option key={index} value={index + 1}>
              {new Date(0, index).toLocaleString("en", { month: "long" })}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="year" className="block text-sm font-medium text-gray-700">
          Year
        </label>
        <select
          id="year"
          value={filters.year}
          onChange={(e) =>
            setFilters({ ...filters, year: parseInt(e.target.value) })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {/* Add options for years */}
          {Array.from({ length: 10 }, (_, index) => (
            <option key={index} value={new Date().getFullYear() - index}>
              {new Date().getFullYear() - index}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSearch}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 self-end"
      >
        Search
      </button>
    </div>


</div>

      <p className="text-gray-600">
        Showing results for:{" "}
        <strong>
          {`Month: ${new Date(0, filters.month - 1).toLocaleString("en-US", {
            month: "long",
          })}, Year: ${filters.year}`}
        </strong>
      </p>
    </div>

    {/* Expenses Table */}
    <Table striped bordered hover className="shadow-md">
      <thead>
        <tr>
          <th>Expense Date</th>
          <th>Product Name</th>
          <th>Quantity Purchased</th>
          <th>Unit Price</th>
          <th>Amount</th>
          <th>Really Needed?</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
      {expenses.data.length > 0 ? (
        expenses.data.map((expense) => (
          <ExpenseRow
            id={expense.id}
            date={expense.date.split("T")[0]}
            name={expense.name}
            quantity_purchased={expense.quantity_purchased}
            unit_price={expense.unit_price}
            amount={expense.amount}
            really_needed={expense.really_needed ? "yes" : "no"}
            key={expense.id}
            handleDelete={handleDelete}
            handleUpdate={handleUpdate}
            openModal={openModal}
          />
        ))): (
          <tr>
            <td colSpan="7" className="text-center">
              No records found
            </td>
          </tr>
        )}
      </tbody>
    </Table>

    {/* Confirm Delete Modal */}
    <ConfirmDeleteModal
      isOpen={isModalOpen}
      onClose={closeModal}
      onConfirm={handleDelete}
      itemName={expenseToDelete?.name || "this item"}
    />
  </div>
  );
};

export default ExpensesList;
