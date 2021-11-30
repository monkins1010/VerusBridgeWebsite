import React from 'react'

import { Card, CardContent } from '@mui/material'
import { styled } from '@mui/system'

const WalletCard = ({ children, isSelected, onClick }) => (
    <StyledCard isSelected={isSelected} onClick={onClick}>
      <CardContent>
        {children}
      </CardContent>
    </StyledCard>
  )

const StyledCard = styled(({ isSelected, ...rest}) => <Card {...rest} />)(({ isSelected, theme }) => ({
  cursor: 'pointer',
  "& svg": {
    height: "100px",
    width: "100px"
  },
  border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.grey[300]}`
}))

export default WalletCard
