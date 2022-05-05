import React from 'react'

import SelectControlField from 'components/SelectControlField'
import { getDestinationOptions } from 'utils/options'

const DestinationField = ({ control, poolAvailable, address, selectedToken }) => {

  const validate = () => {

    if (!['USDC', 'VRSC', 'BETH', 'ETH'].includes(selectedToken))
      return "Selected token is not part of the Converter Currency"
    return "Destination is required"
  }

  return (
    <SelectControlField
      name="destination"
      id="destination"
      label="Destination"
      fullWidth
      defaultValue=""
      variant="standard"
      control={control}
      options={getDestinationOptions(poolAvailable, address, selectedToken)}
      rules={{
        required: validate()

      }}
    />
  )
}
export default DestinationField
