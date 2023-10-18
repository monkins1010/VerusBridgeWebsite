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
    helperText="I-Address, R-address to send to, or Ethereum address for bounceback conversions"
    rules={{
      required: 'Address is required',
      validate: async (address) => validateAddress(address)
    }}
  />
)

export default AddressField
