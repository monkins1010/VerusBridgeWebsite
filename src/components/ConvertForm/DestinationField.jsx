import React from 'react'

import SelectControlField from 'components/SelectControlField'
import { GLOBAL_ADDRESS } from 'constants/contractAddress';
import { getDestinationOptions } from 'utils/options'

const DestinationField = ({ control, poolAvailable, address, selectedToken }) => {

  const { value, name } = selectedToken || {};
  const validate = () => {

    if (![GLOBAL_ADDRESS.DAI, GLOBAL_ADDRESS.VRSC, GLOBAL_ADDRESS.BETH, GLOBAL_ADDRESS.ETH].includes(value))
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
      options={getDestinationOptions(poolAvailable, address, value, name)}
      rules={{
        required: validate()

      }}
    />
  )
}
export default DestinationField
