import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import NavBar from './components/Navbar';
import { ExpenseTypeProvider } from "./ExpenseTypeContext";
import AddExpenseForm from "./components/AddExpense";
import { ExpenseProvider } from "./ExpenseContext";
import ExpensesList from "./components/ExpensesList";
import { UpdateExpenseProvider } from "./UpdateExpenseContext";
import UpdateExpenseForm from "./components/UpdateExpense";
import Dashboard from "./components/Dashboard";
import Login from "./Login";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  const [user, setUser] = useState(null);
  const location = useLocation(); // Get the current URL
  const navigate = useNavigate(); // To navigate after login

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
        fetch("http://127.0.0.1:8000/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => res.json())
        .then((data) => setUser(data))
        .catch(() => localStorage.removeItem("token"));
    }
}, []);

  return (
    <div>
      {/* {isAuthenticated ? ( */}
        <ExpenseTypeProvider>
          <ExpenseProvider>
            <NavBar />
            <div className="row">
              <div className="col-sm-10 col-xm-12 mr-auto ml-auto mt-4 mb-4">
                <UpdateExpenseProvider>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<PrivateRoute element={<ExpensesList />} />} />
                    <Route path="/addExpense" element={<PrivateRoute element={<AddExpenseForm />} />} />
                    <Route path="/updateExpense/:id" element={<PrivateRoute element={<UpdateExpenseForm />} />} />
                    <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
                  </Routes>
                </UpdateExpenseProvider>
              </div>
            </div>
          </ExpenseProvider>
        </ExpenseTypeProvider>
    </div>
  );
}

export default App;
