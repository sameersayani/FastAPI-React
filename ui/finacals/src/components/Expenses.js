import react from "react";

const ExpenseRow = ({id, date, name, quantity_purchased, unit_price, amount, really_needed, handleDelete, handleUpdate }) => {
    return (
        <tr>
            <td>{date}</td>
            <td>{name}</td>
            <td>{quantity_purchased}</td>
            <td>{unit_price}</td>
            <td>{amount}</td>
            <td>{really_needed}</td>
            <td>
                <button onClick={() => handleUpdate(id)} className="btn btn-outline-info btn-sm ml-1 mr-2">Update</button>
                <button onClick={() => handleDelete(id)} className="btn btn-outline-danger btn-sm mr-2">Delete</button>
            </td>
        </tr>
    );
};

export default ExpenseRow;