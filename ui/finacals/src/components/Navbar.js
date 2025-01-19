import {react, useContext, useState} from "react";
import {Navbar, Nav, Form, FormControl, Button, Badge} from 'react-bootstrap';
import {Link} from  "react-router-dom";
import { ExpenseContext } from "../ExpenseContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIndianRupeeSign } from '@fortawesome/free-solid-svg-icons';

const NavBar = () => {
    const [search, setSearch] = useState("");
    const [expenses, setExpenses] = useContext(ExpenseContext);
    
    const updateSearch = (e) => {
        setSearch(e.target.value);
    }
    
    const filterExpense = (e) => {
      e.preventDefault()
      const expense = expenses?.data?.filter(expense => 
        expense?.name?.toLowerCase().startsWith(search?.toLowerCase())) || [];
      setExpenses({"data" : [...expense]})
  }

    return(
        <Navbar bg="dark" expand="lg" variant="dark">
        <div className="container-fluid">
          {/* Brand */}
          <Navbar.Brand href="/">
              <FontAwesomeIcon icon={faIndianRupeeSign} style={{ paddingLeft: '10px', fontSize:'2em' }}  />
          </Navbar.Brand>
  
          {/* Toggle for Small Screens */}
          <Navbar.Toggle aria-controls="navbar-nav" />
  
          {/* Collapsible Content */}
          <Navbar.Collapse id="navbar-nav">
            <Nav className="mr-auto align-items-center">
              <Badge className="mt-2" variant="primary">Items purchased {expenses?.data?.length || 0}</Badge>
            </Nav>
  
            {/* Right-Side Form */}
            <Form className="d-flex align-items-center" 
            style={{ width: '70%' }}
            onSubmit={filterExpense}
            inline="true">
              Add New Expense
              <Link
                to="/addexpense"
                className="btn btn-primary btn-sm me-3"
                style={{ whiteSpace: 'nowrap' }}
              >
                Add Expense
              </Link>
              <Navbar.Brand href="dashboard">Charts</Navbar.Brand>
              Search Bar
              <FormControl
                type="text"
                placeholder="Search by product name"
                className="me-3"
                style={{ minWidth: '10px' }}
                value={search}
                onChange={updateSearch}
              />
  
              {/* Search Button */}
              <Button type="submit" 
              variant="outline-primary"
              onChange={updateSearch}
              >
                Search
              </Button>
            </Form>
          </Navbar.Collapse>
        </div>
      </Navbar>
    );
}

export default NavBar;