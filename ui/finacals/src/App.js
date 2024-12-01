import react, {useState} from "react";
import {BrowserRouter as Router, Link, Route, Routes, Switch} from "react-router-dom";
import NavBar from './components/Navbar';
import { ExpenseTypeProvider } from "./ExpenseTypeContext";
import AddExpenseForm from "./components/AddExpense";
import { ExpenseProvider } from "./ExpenseContext";
import ExpensesList from "./components/ExpensesList";
import { UpdateExpenseContextProvider } from "./UpdateExpenseContext";

function App() {
  return (
    <div>
      <Router>
        <Switch>
          <ExpenseTypeProvider>
            <NavBar />
            <div className="row">
              <div className="col-sm-10 col-xm-12 mr-auto ml-auto mt-4 mb-4">
                <ExpenseProvider>
                  <UpdateExpenseContextProvider>
                    <Route exact path="/" component={ExpensesList} />
                    <Route exact path="/addExpense" component={AddExpenseForm} />
                  </UpdateExpenseContextProvider>
                  </ExpenseProvider>
                  {/* <Route exact path="/addExpense" component={AddProducts} />
                  <Route exact path="/updateproduct" component={UpdateProduct} />
                  <Route exact path="/supplierpage" component={SupplierPage} /> */}
              </div>
            </div>
          </ExpenseTypeProvider>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
