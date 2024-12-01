import react, { useContext, useState} from 'react'
import { Form, Button, Card } from 'react-bootstrap'
import {UpdateContext} from '../UpdateExpenseContext'

const UpdateExpense= () => {
    const [updateExpenseInfo, setUpdateExpenseInfo] = useContext(UpdateContext);

    // Ensure controlled values
    const controlledValues = {
        ExpenseDate: updateExpenseInfo.ExpenseDate,
        ProductName: updateExpenseInfo.ProductName || "",
        QuantityInStock: updateExpenseInfo.QuantityPurchased || "0",
        UnitPrice: updateExpenseInfo.UnitPrice || "0",
        Amount: updateExpenseInfo.Amount || "0",
        ReallyNeeded: updateExpenseInfo.ReallyNeeded || "0",
        Id: updateExpenseInfo.Id || ""
    };

    const updateForm = (e) => {
        setUpdateExpenseInfo({ ...updateExpenseInfo, [e.target.name]: e.target.value });
    };

    const postData = async (e) => {
        e.preventDefault();

        const url = `http://localhost:8000/dailyexpense/${updateExpenseInfo.Id}`;

        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                date: controlledValues.date,
                name: controlledValues.ProductName,
                quantity_purchased: controlledValues.QuantityInStock,
                unit_price: controlledValues.UnitPrice,
                amount: controlledValues.Amount,
                really_needed: controlledValues.ReallyNeeded,
            }),
        });

        const resp = await response.json();
        alert(resp.status === "OK" ? "Expense details updated" : "Failed to update expense details");

        setUpdateExpenseInfo({
            ExpenseDate: "",
            ProductName: "",
            QuantityPurchased: "",
            UnitPrice: "",
            Amount: "",
            ReallyNeeded: ""
        });
    };

    return (
        <Card>
            <Card.Body>
                <Form onSubmit={postData}>
                    {Object.keys(controlledValues).map((key) => (
                        <Form.Group key={key} controlId={key}>
                            <Form.Label>{key.replace(/([A-Z])/g, " $1")}</Form.Label>
                            <Form.Control
                                type="text"
                                name={key}
                                value={controlledValues[key]}
                                onChange={updateForm}
                                placeholder={key}
                            />
                        </Form.Group>
                    ))}
                    <Button variant="primary" type="submit">
                        Submit
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default UpdateExpense;
