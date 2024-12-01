import react, {createContext, useState} from "react";

export const UpdateContext = createContext();

export const UpdateExpenseContextProvider = (props) => {
    const[updateExpenseInfo, setUpdateExpenseInfo] = useState({
        ExpenseDate: "",
        ProductName: "",
        QuantityPurchased: 0,
        UnitPrice: 0,
        Amount: 0,
        ReallyNeeded: ""
    })

    return(
        <UpdateContext.Provider value={[updateExpenseInfo, setUpdateExpenseInfo]}>
            {props.children}
        </UpdateContext.Provider>
    )
}