import React, { createContext, useContext, useState } from "react";

const UpdateExpenseContext = createContext();

export const useUpdateExpenseContext = () => useContext(UpdateExpenseContext);

export const UpdateExpenseProvider = ({ children }) => {
    const [expenseData, setExpenseData] = useState(null);
    const [loading, setLoading] = useState(false);
  
    const loadExpense = (id) => {
      setLoading(true); // Start loading
      fetch(`http://127.0.0.1:8000/dailyexpense/${id}`)
        .then((response) => {
          if (!response.ok) throw new Error("Failed to load expense.");
          return response.json();
        })
        .then((data) => {
          console.log("Fetched Expense Data:", data); // Debugging log
          setExpenseData(data);
          console.log("expenseId:", id);
        //   setExpenseData({
        //     ...data.data, // Spread existing fields
        //     expense_type_id: data.data.expense_type?.id || null, // Extract expense_type_id explicitly
        //   });
        })
        .catch((err) => {
          console.error("Error loading expense:", err);
        })
        .finally(() => {
          setLoading(false); // Finished loading
        });
    };
  
     // The updateExpense function should send a PUT request to update the expense
  const updateExpense = async (id, updatedData) => {
    try {
    //   if (!id) {
    //     console.error("Missing expenseId");
    //     return;
    //     }
      const expenseTypeId = updatedData.expense_type_id;
      if (!expenseTypeId) {
        console.error("Missing expense_type_id");
        return;
      }
      const response = await fetch(
        // `http://127.0.0.1:8000/dailyexpense/${expenseId}/expensetype/${expenseTypeId}`,
        `http://127.0.0.1:8000/dailyexpense/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: updatedData.date,
            name: updatedData.name,
            quantity_purchased: updatedData.quantity_purchased,
            unit_price: updatedData.unit_price,
            amount: updatedData.amount,
            really_needed: updatedData.really_needed,
            expense_type_id:  updatedData.expense_type_id
          }),
        }
      );

      if (!response.ok) throw new Error(`Failed to update expense: ${response.statusText}`);
      const result = await response.json();
      console.log('Expense updated successfully:', result);
      return result;
    } catch (err) {
      console.error('Error updating expense:', err);
      throw err;
    }
  };

    return (
      <UpdateExpenseContext.Provider value={{ 
        expenseData, 
        loadExpense, 
        updateExpense, 
        loading 
        }}>
        {children}
      </UpdateExpenseContext.Provider>
    );
  };
  