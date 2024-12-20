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

  useEffect(() => {
    fetch("http://127.0.0.1:8000/dailyexpense")
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        setExpenses({ data: [...result.data] });
      });
  }, []);

  return (
    <div>
      <Table striped bordered hover>
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
          {expenses.data.map((expense) => (
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
          ))}
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
