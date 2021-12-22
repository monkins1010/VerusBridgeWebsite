import React from 'react'

import InputControlField from 'components/InputControlField'
import { validateAddress } from 'utils/rules'

const AddressField = ({ control }) => (
    <InputControlField
      name="address"
      label="Address"
      fullWidth
      variant="standard"
      defaultValue=""
      control={control}
      helperText="I-Address, R-address, or Ethereum address to send conversion back to Ethereum"
      rules={{
        required: 'Address is required',
        validate: validateAddress
      }}
    />
  )

export default AddressField
