import * as React from 'react';

import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Paper from '@mui/material/Paper';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import styled from '@mui/material/styles/styled'
import Typography from '@mui/material/Typography';

import TransactionForm from '../components/ConvertForm/TransactionForm';
import Header from '../components/Header';

const theme = createTheme();

export default function Checkout() {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <StyledContainer component="main" maxWidth="sm">
        <Paper variant="outlined" sx={{ px: { xs: 2, md: 3 }, py: {md: 8, xs: 2}, mb:3 }}>
          <Typography component="h1" variant="h4" align="center" sx={{mb:3}}>
            Verus Ethereum Bridge
          </Typography>
          <TransactionForm />
        </Paper>
      </StyledContainer>
    </ThemeProvider>
  );
}

const StyledContainer = styled(Container)(() => ({
  display: 'flex', 
  flexDirection: "column", 
  justifyContent:'center', 
  height:"calc(100vh - 64px)"
}))
