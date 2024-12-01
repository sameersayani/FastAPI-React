import {useState, createContext} from "react";
export const ExpenseContext  = createContext();

export const ExpenseProvider = (props) =>{
    const[expense, setExpense] = useState({"data": [] });
    return(
        <ExpenseContext.Provider
         value ={[expense, setExpense]}>
            {props.children}
        </ExpenseContext.Provider>
    );
}