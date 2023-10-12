import * as React from 'react'

import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Paper from '@mui/material/Paper'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import styled from '@mui/material/styles/styled'
import Typography from '@mui/material/Typography'

import StatsGrid from 'components/StatsGrid/StatsGrid'

import TransactionForm from '../components/ConvertForm/TransactionForm'
import Header from '../components/Header'

const theme = createTheme()

export default function Checkout() {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <StyledRow>
        <StyledContainer component="main" maxWidth="sm">
          <Typography component="h2" variant="h4" align='center' sx={{ mb: 3 }}>Verus Bridge Stats</Typography>
          <StatsGrid />
        </StyledContainer>
        <StyledContainer component="main" maxWidth="sm">
          <Paper variant="outlined" sx={{ px: { xs: 2, md: 3 }, py: { md: 8, xs: 2 }, mb: 3, border: '2px solid grey', borderRadius: '10px' }}>
            <Typography component="h1" variant="h4" align="center" sx={{ mb: 3 }}>
              Verus Ethereum Bridge
            </Typography>
            <TransactionForm />
          </Paper>
        </StyledContainer>
      </StyledRow>
    </ThemeProvider>
  )
}

const StyledContainer = styled(Container)(() => ({
  display: 'flex',
  flexDirection: "column",
  justifyContent: 'center',
  height: "calc(100vh - 64px)"
}))

const StyledRow = styled('div')(({ theme }) => ({
  display: 'flex',
  margin: '0 200px',
  [ theme.breakpoints.down('lg') ]: {
    flexDirection: 'column-reverse'
  },
  [ theme.breakpoints.up('lg') ]: {
    flexDirection: 'row'
  },

  justifyContent: 'center'

}))


