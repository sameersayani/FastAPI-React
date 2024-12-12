import {react, useContext, useState} from "react";
import {Navbar, Nav, Form, FormControl, Button, Badge} from 'react-bootstrap';
import {Link} from  "react-router-dom";
import { ExpenseTypeContext } from "../ExpenseTypeContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIndianRupeeSign } from '@fortawesome/free-solid-svg-icons';

const NavBar = () => {
    const [search, setSearch] = useState("");
    const [expenseType, setExpenseType] = useContext(ExpenseTypeContext);
    
    const updateSearch = (e) => {
        setSearch(e.target.value);
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
              {/* Badge */}
              
            </Nav>
  
            {/* Right-Side Form */}
            <Form className="d-flex align-items-center" 
            style={{ width: '70%' }}
            // onSubmit={filterProduct}
            >
              Add New Expense
              <Link
                to="/addexpense"
                className="btn btn-primary btn-sm me-3"
                style={{ whiteSpace: 'nowrap' }}
              >
                Add Expense
              </Link>
  
              {/* Search Bar */}
              <FormControl
                type="text"
                placeholder="Search"
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