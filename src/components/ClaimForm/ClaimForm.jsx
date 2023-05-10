import React, { useState } from 'react';

import { LoadingButton } from '@mui/lab';
import { Alert, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Box } from '@mui/system';
import { useWeb3React } from '@web3-react/core';
import { useForm } from 'react-hook-form';
import web3 from 'web3';

import DELEGATOR_ABI from 'abis/DelegatorAbi.json';
import {
    DELEGATOR_ADD
} from 'constants/contractAddress';
import useContract from 'hooks/useContract';

import { useToast } from '../Toast/ToastProvider';
import AddressAddressFieldField from './ClaimAddressField';


export default function ClaimForm() {
    const [isTxPending, setIsTxPending] = useState(false);
    const [alert, setAlert] = useState(null);
    const { addToast } = useToast();
    const { account } = useWeb3React();
    const delegatorContract = useContract(DELEGATOR_ADD, DELEGATOR_ABI);

    const { handleSubmit, control } = useForm({
        mode: 'all'
    });

    const uint64ToVerusFloat = (number) => {

        const input = BigInt(number);
        let inter = `${(input / BigInt(100000000))}.`
        let decimalp = `${(input % BigInt(100000000))}`

        if (input < 0) {
            inter = `-${inter}`;
            decimalp = decimalp.slice(1);
        }

        while (decimalp.length < 8) {
            decimalp = `0${decimalp}`;
        }
        return (inter + decimalp)
    }

    const checkFees = async (address) => {

        const formattedAddress = `0x0c14${web3.utils.padLeft(address.slice(2), 60)}`
        const feesSats = await delegatorContract.callStatic.claimableFees(formattedAddress);
        const fees = uint64ToVerusFloat(feesSats);
        addToast({ type: "success", description: `You have ${fees} ETH to claim` });
    }

    const onSubmit = async (values) => {
        const { address } = values;
        setAlert(null);
        setIsTxPending(true);

        try {
            await checkFees(address);
            setAlert(null);
            setIsTxPending(false);
        } catch (error) {
            if (error.message) {
                addToast({ type: "error", description: error.message })
            } else {
                addToast({ type: "error", description: 'Transaction Failed!' })
            }
            setAlert(null);
            setIsTxPending(false);
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)}>
                {alert &&
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        <Typography>
                            {alert}
                        </Typography>
                    </Alert>
                }
                {!account && (<Alert severity="info" sx={{ mb: 3 }}>
                    <Typography>
                        <b>Wallet not connected</b>
                    </Typography>
                </Alert>)
                }
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <AddressAddressFieldField
                            control={control}
                        />
                    </Grid>
                    <Box mt="30px" textAlign="center" width="100%">
                        <LoadingButton loading={isTxPending} type="submit" color="primary" variant="contained">Send</LoadingButton>
                    </Box>
                </Grid>
            </form>
        </>
    );
}