import React, { useEffect, useState, useRef } from 'react';

import { ECPair, networks } from '@bitgo/utxo-lib';
import { LoadingButton } from '@mui/lab';
import { Alert, Typography, Button } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import { Box } from '@mui/system';
import { useWeb3React } from '@web3-react/core';
import { utils } from 'ethers'
import { useForm } from 'react-hook-form';
import { Link } from "react-router-dom";
import web3 from 'web3';

import DELEGATOR_ABI from 'abis/DelegatorAbi.json';
import {
    DELEGATOR_ADD
} from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { validateClaimAddress, isRAddress, isiAddress, uint64ToVerusFloat } from 'utils/rules';

import AddressAddressFieldField from './ClaimAddressField';
import bitGoUTXO from '../../utils/bitUTXO';
import TokenField from '../ConvertForm/TokenField';
import { useToast } from '../Toast/ToastProvider';

const maxGas = 6000000;
const TYPE_FEE = 1;
const TYPE_REFUND = 2;
const TYPE_NOTARY_FEE = 3;
const TYPE_DAI_BURN_BACK = 4;

function usePreviousValue(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

export default function ClaimForm() {
    const [isTxPending, setIsTxPending] = useState(false);
    const [alert, setAlert] = useState(null);
    const [feeToClaim, setFeeToClaim] = useState(null);
    const { addToast, removeAllToasts } = useToast();
    const { account } = useWeb3React();
    const previousValue = usePreviousValue(account);
    const delegatorContract = useContract(DELEGATOR_ADD, DELEGATOR_ABI);
    const [usePublicKey, setUsePublicKey] = useState(false);
    const [claimRefund, setclaimRefund] = useState(false);
    const { handleSubmit, control, watch, reset } = useForm({
        mode: 'all'
    });
    const address = watch('address');
    const refundCurrency = watch('token');

    const handleUsePublicKeyChange = (event) => {
        reset({ address: "" });
        setUsePublicKey(event.target.checked);
        if (claimRefund) {
            setclaimRefund(false);
        }
    };

    const handleRefundsEnable = (event) => {

        setclaimRefund(event.target.checked);
        if (!event.target.checked) {
            reset({ address: "" });
        } else {
            setUsePublicKey(false);
        }
    };


    const formatHexAddress = (address, type) => {
        try {
            const verusAddress = bitGoUTXO.address.fromBase58Check(address);
            let retval;
            switch (verusAddress.version) {
                case 60: // case R address
                    retval = Buffer.from(`${web3.utils.padLeft(`0214${verusAddress.hash.toString('hex')}`, 64)}`, 'hex');
                    break;
                case 102: // case i address
                    retval = Buffer.from(`${web3.utils.padLeft(`0414${verusAddress.hash.toString('hex')}`, 64)}`, 'hex');
                    break;
                default:
                    return null;
            }
            if (type === TYPE_REFUND) {
                retval[0] = 2;
            }

            return `0x${retval.toString('hex')}`;

        } catch (error) {
            throw new Error("Invalid Address");
        }
    }

    const checkForAssets = async (address, type, currency) => {

        const formattedAddress = formatHexAddress(address, type);
        let feeSats;
        if (type === TYPE_FEE) {
            feeSats = await delegatorContract.callStatic.claimableFees(formattedAddress);

        } else if (type === TYPE_REFUND) {
            feeSats = await delegatorContract.callStatic.refunds(formattedAddress, currency);

        }
        const fees = uint64ToVerusFloat(feeSats);
        setAlert({ state: fees === "0.00000000" ? "warning" : "info", message: `${fees} ETH available to claim` });
        setFeeToClaim(fees);
        return fees;
    }

    useEffect(() => {
        if (address && (isRAddress(address) || isiAddress(address))) {
            if (!claimRefund) {
                if (previousValue ? (previousValue !== address || feeToClaim === null || feeToClaim === "0.00000000") : true) {
                    checkForAssets(address, TYPE_FEE);
                }
            } else if (refundCurrency && refundCurrency.value) {
                checkForAssets(address, TYPE_REFUND, refundCurrency.value);

            } else {
                removeAllToasts();
                setFeeToClaim(null)
                setAlert(null);
            }
        } else if (address && validateClaimAddress(address) !== true && feeToClaim !== null) {
            removeAllToasts();
            setFeeToClaim(null)
            setAlert(null);
        }
    }, [address, claimRefund, refundCurrency])

    const onSubmit = async (values) => {
        const { address } = values;
        setAlert(null);
        setIsTxPending(true);

        try {
            if (usePublicKey) {
                try {
                    const from = account;
                    // For historical reasons, you must submit the message to sign in hex-encoded UTF-8.
                    // This uses a Node.js-style buffer shim in the browser.
                    const msg = `0x${Buffer.from("Agreeing to this will create a public key address for Verus Refunds.", 'utf8').toString('hex')}`;
                    const sign = await window.ethereum.request({
                        method: 'personal_sign',
                        params: [msg, from]
                    });

                    const messageHash = utils.hashMessage("Agreeing to this will create a public key address for Verus Refunds.");
                    const messageHashBytes = utils.arrayify(messageHash);

                    // Now you have the digest,
                    const publicKey = utils.recoverPublicKey(messageHashBytes, sign);
                    const compressed = utils.computePublicKey(publicKey, true)

                    const rAddress = ECPair.fromPublicKeyBuffer(Buffer.from(compressed.slice(2), 'hex'), networks.verustest).getAddress()

                    if (await checkForAssets(rAddress, TYPE_FEE) === "0.00000000") {
                        setIsTxPending(false);
                        return
                    }

                    const { x, y } = { x: publicKey.slice(4, 68), y: publicKey.slice(68, 132) };

                    const txResult = await delegatorContract.sendfees(`0x${x}`, `0x${y}`, { from: account, gasLimit: maxGas });
                    await txResult.wait();
                    setAlert(null);
                    setIsTxPending(false);
                    addToast({ type: "success", description: 'Claim to ETH Transaction Success!' });
                    setFeeToClaim(null)
                } catch (err) {
                    setAlert(`
                         Error with public key: ${err.message} `
                    );
                    throw err
                }
            } else if (claimRefund) {
                const hexResult = formatHexAddress(address, TYPE_REFUND)
                const txResult = await delegatorContract.claimRefund(hexResult, refundCurrency.value, { from: account, gasLimit: maxGas });
                const txWaitResult = await txResult.wait();
                setAlert(null);
                setIsTxPending(false);
                addToast({ type: "success", description: 'Refund Transaction Success!' });
                setFeeToClaim(null)
            }
            else {
                const hexResult = formatHexAddress(address, TYPE_FEE)
                const txResult = await delegatorContract.sendfees(hexResult, `0x${Buffer.alloc(32).toString('hex')}`, { from: account, gasLimit: maxGas });
                const txWaitResult = await txResult.wait();
                setAlert(null);
                setIsTxPending(false);
                addToast({ type: "success", description: 'Fee reimburse Transaction Success!' });
                setFeeToClaim(null)
            }
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
                    <Alert severity={alert.state} sx={{ mb: 3 }}>
                        <Typography>
                            {alert.message}
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
                            usePublicKey={usePublicKey}
                            disabled={usePublicKey}
                        />
                    </Grid>
                    <Box mt="30px" textAlign="center" width="100%">
                        <LoadingButton loading={isTxPending} disabled={(feeToClaim === null || feeToClaim === "0.00000000") && !usePublicKey} type="submit" color="primary" variant="contained">Claim</LoadingButton>
                    </Box>
                    <Grid item xs={12}>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={usePublicKey}
                                        onChange={handleUsePublicKeyChange}
                                        name="usePublicKey"
                                    />
                                }
                                sx={{ fontSize: '20px' }} // add this line to set the font size
                            />
                            <Typography sx={{ fontSize: 12 }}>
                                Use your Public Key to claim
                            </Typography>
                        </FormGroup>
                    </Grid>
                    <Grid item xs={12}>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={claimRefund}
                                        onChange={handleRefundsEnable}
                                        name="claimRefund"
                                    />
                                }
                                sx={{ fontSize: '20px' }} // add this line to set the font size
                            />
                            <Typography sx={{ fontSize: 12 }}>
                                Fees / Refund (Claim Type)
                            </Typography>
                        </FormGroup>
                    </Grid>
                    <Grid item xs={12}>
                        {claimRefund && (<TokenField
                            control={control}
                            poolAvailable={false}
                            token="Refund Currency"
                        />)}
                    </Grid>

                </Grid>
                <div style={{ alignItems: 'center', paddingTop: 42 }}>
                    <Link to="/">
                        <Button variant="outlined">
                            BACK
                        </Button>
                    </Link>
                </div>
            </form>

        </>
    );
}