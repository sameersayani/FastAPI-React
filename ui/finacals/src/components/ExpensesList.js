import React, { useEffect, useContext } from "react";
import { Table } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { ExpenseTypeContext } from "../ExpenseTypeContext";
import { ExpenseContext } from "../ExpenseContext";
import ExpenseRow from "./Expenses";
import { useUpdateExpenseContext } from "../UpdateExpenseContext";

const ExpensesList = () => {
  const [expenseType, setExpenseType] = useContext(ExpenseTypeContext);
  const [expenses, setExpenses] = useContext(ExpenseContext);
  const { loadExpense } = useUpdateExpenseContext(); // Use loadExpense from the context

  let history = useHistory();

  const handleDelete = (id) => {
    fetch("http://127.0.0.1:8000/dailyexpense/" + id, {
      method: "DELETE",
      headers: {
        accept: "application/json",
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        if (result.status === "OK") {
          const filteredExpenses = expenses.data.filter(
            (expense) => expense.id !== id
          );
          setExpenses({ data: [...filteredExpenses] });
          alert("Expense deleted");
        } else {
          alert("Expense deletion failed !");
        }
      });
  };

  const handleUpdate = (id) => {
    // Load the selected expense data by ID
    loadExpense(id); // Use loadExpense to populate the context with the data
    history.push(`/updateexpense/${id}`); // Navigate to the Update Expense page
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
            />
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ExpensesList;
