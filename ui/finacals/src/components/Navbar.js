import {react, useContext, useState} from "react";
import {Navbar, Nav, Form, FormControl, Button, Badge} from 'react-bootstrap';
import {Link} from  "react-router-dom";
import {ProductContext} from "../ProductContext";

const NavBar = () => {
    const [search, setSearch] = useState("");
    const [products, setProducts] = useContext(ProductContext);
    
    const updateSearch = (e) => {
        setSearch(e.target.value);
    }
    const filterProduct = (e) => {
        e.preventDefault();
        if (!products || !products.data) return;
        const product = products.data.filter(
            product => product.name.toLowerCase() === 
            search.toLowerCase())
        setProducts({"data": [...product]})
    }
    return(
        <Navbar bg="dark" expand="lg" variant="dark">
        <div className="container-fluid">
          {/* Brand */}
          <Navbar.Brand href="#home">Inventory Management App</Navbar.Brand>
  
          {/* Toggle for Small Screens */}
          <Navbar.Toggle aria-controls="navbar-nav" />
  
          {/* Collapsible Content */}
          <Navbar.Collapse id="navbar-nav">
            <Nav className="mr-auto align-items-center">
              {/* Badge */}
              <Badge  bg="primary" className="ml-2 me-3">
                Products In Stock {products.data.length}
              </Badge>
            </Nav>
  
            {/* Right-Side Form */}
            <Form className="d-flex align-items-center" 
            style={{ width: '70%' }}
            onSubmit={filterProduct}>
              {/* Add Product Button */}
              <Link
                to="/addproduct"
                className="btn btn-primary btn-sm me-3"
                style={{ whiteSpace: 'nowrap' }}
              >
                Add Product
              </Link>
  
              {/* Search Bar */}
              <FormControl
                type="text"
                placeholder="Search"
                className="me-2"
                style={{ minWidth: '200px' }}
                value={search}
                onChange={updateSearch}
              />
  
              {/* Search Button */}
              <Button type="submit" 
              variant="outline-primary"
            //   onChange={updateSearch}
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