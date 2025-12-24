'use Client';

import React from "react";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Badge,
  Container,
} from "@mui/material";
// import { useCart } from "./cart/CartContext";
import Image from 'next/image';
const Navbar = () => {
  // const { openCart } = useCart();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)" }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ minHeight: { xs: 64, sm: 72 }, px: { xs: 0, sm: 1 } }}>
          {/* Logo */}
          {/* <Box
            component="img"
            src={'../../app/logoT.png'}
            alt="Logo"
            sx={{ height: { xs: 26, sm: 30 }, width: "auto" }}
          /> */}
 <Image
              src="/logo.svg" 
              alt="SyndetAI Logo" 
              width={24}
              height={24}
              className="logo-svg"
            />
          <Box sx={{ flexGrow: 1 }} />

          {/* Cart */}
          <IconButton aria-label="cart">
            <Badge badgeContent={0} color="primary">
              <Box
                component="img"
                src="/cartB.svg"
                alt="Cart"
                // onClick={openCart}
                sx={{ width: { xs: 24, sm: 26 }, height: { xs: 24, sm: 26 } }}
              />
            </Badge>
          </IconButton>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
