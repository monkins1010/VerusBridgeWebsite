import * as React from 'react';

import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import AddressForm from '../components/AddressForm';
import Header from '../components/Header';

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      {'Copyright © '}
      <Link color="inherit" target="_blank" href="https://verus.io/">
        Verus
      </Link>{' '}
      {new Date().getFullYear()}
      .
    </Typography>
  );
}

const theme = createTheme();

export default function Checkout() {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <Container component="main" maxWidth="sm" sx={{display: 'flex', flexDirection: "column", justifyContent:'center', height:"calc(100vh - 64px)"}}>
        <Paper variant="outlined" sx={{ px: { xs: 2, md: 3 }, py: {md: 8, xs: 2}, mb:3 }}>
          <Typography component="h1" variant="h4" align="center" sx={{mb:3}}>
            Verus Currency Swap
          </Typography>
          <AddressForm />
        </Paper>
        <Copyright />
      </Container>
    </ThemeProvider>
  );
}