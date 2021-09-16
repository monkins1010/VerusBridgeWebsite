// import bitGoUTXO from  'bitgo-utxo-lib'
import { encrypt } from 'eth-sig-util'
import MetaMaskOnboarding from '@metamask/onboarding'
import Web3 from 'web3'

const bitGoUTXO = require('./bitUTXO')
const verusBridgeAbi = require('./VerusBridgeAbi.json')

const verusBridgeContractAdd = '0xa38C008CEA814f3B2B6b5C4ce14A4645d563F75F'
const ethNode = 'wss://rinkeby.infura.io/ws/v3/46789909a2fe4985bbb866f2878f940c'
let maxGas = 6000000;

// var verusContract = Web3.eth.contract(verusBridgeAbi);
// var VerusContract = verusContract.at(verusBridgeContractAdd);

let myweb3 = {};
let verusBridge = {};




const currentUrl = new URL(window.location.href)
const forwarderOrigin = currentUrl.hostname === 'localhost'
  ? 'http://localhost:9010'
  : undefined

const isMetaMaskInstalled = () => {
  const { ethereum } = window
  return Boolean(ethereum && ethereum.isMetaMask)
}

// Dapp Status Section
const networkDiv = document.getElementById('network')
const chainIdDiv = document.getElementById('chainId')
const accountsDiv = document.getElementById('accounts')

// Basic Actions Section
const onboardButton = document.getElementById('connectButton')
const accountadd = document.getElementById('accountadd')
const getAccountsResults = document.getElementById('getAccountsResult')


// Send Eth Section
const sendETHButton = document.getElementById('sendETHButton')
const SendETHAddress1 = document.getElementById('InputToken1')
const SendETHAmount1 = document.getElementById('Inputamount1')
const SendETHToken1 = document.getElementById('InputTokenLable')
const statusVerus1 = document.getElementById('statusVerus')

// Send Tokens Section
const tokenAddress = document.getElementById('tokenAddress')
const createToken = document.getElementById('createToken')
const transferTokens = document.getElementById('transferTokens')
const approveTokens = document.getElementById('approveTokens')
const transferTokensWithoutGas = document.getElementById('transferTokensWithoutGas')
const approveTokensWithoutGas = document.getElementById('approveTokensWithoutGas')


// Encrypt / Decrypt Section
const getEncryptionKeyButton = document.getElementById('getEncryptionKeyButton')
const encryptMessageInput = document.getElementById('encryptMessageInput')
const encryptButton = document.getElementById('encryptButton')
const decryptButton = document.getElementById('decryptButton')
const encryptionKeyDisplay = document.getElementById('encryptionKeyDisplay')
const ciphertextDisplay = document.getElementById('ciphertextDisplay')
const cleartextDisplay = document.getElementById('cleartextDisplay')

const initialize = async () => {

  let onboarding
  try {
    onboarding = new MetaMaskOnboarding({ forwarderOrigin })
  } catch (error) {
    console.error(error)
  }

  let accounts

  let accountButtonsInitialized = false

  const accountButtons = [

    createToken,
    transferTokens,
    approveTokens,
    transferTokensWithoutGas,
    approveTokensWithoutGas,

  ]

  const isMetaMaskConnected = () => accounts && accounts.length > 0

  const onClickInstall = () => {
    onboardButton.innerText = 'Onboarding in progress'
    onboardButton.disabled = true
    onboarding.startOnboarding()
  }

  const onClickConnect = async () => {
    try {
      const newAccounts = await ethereum.request({
        method: 'eth_requestAccounts',
      })
      handleNewAccounts(newAccounts)
    } catch (error) {
      console.error(error)
    }
  }

  const clearTextDisplays = () => {
  //  encryptionKeyDisplay.innerText = ''
  //  encryptMessageInput.value = ''
  //  ciphertextDisplay.innerText = ''
  accountadd.innerText = " Not Connected";
  }


  const updateButtons = () => {
    const accountButtonsDisabled = !isMetaMaskInstalled() || !isMetaMaskConnected()
    if (accountButtonsDisabled) {
      for (const button of accountButtons) {
       // button.disabled = true   ADD IN BUTTONS LIKE SEND
      }
      clearTextDisplays()
    } else {

    accountadd.innerText = verusBridgeContractAdd;
    }

    if (!isMetaMaskInstalled()) {
      onboardButton.innerText = 'Click here to install MetaMask!'
      onboardButton.onclick = onClickInstall
      onboardButton.disabled = false
    } else if (isMetaMaskConnected()) {
      onboardButton.innerText = 'Connected'
      onboardButton.disabled = true
      if (onboarding) {
        onboarding.stopOnboarding()
      }
    } else {
      onboardButton.innerText = 'Connect'
      onboardButton.onclick = onClickConnect
      onboardButton.disabled = false
    }
  }

  const initializeAccountButtons = () => {

    if (accountButtonsInitialized) {
      return
    }
    accountButtonsInitialized = true


    function buf2hex (buffer) { // buffer is an ArrayBuffer
      return [...new Uint8Array(buffer)]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('')
    }


    function convertVerusAddressToEthAddress (verusAddress) {
      const test2 = bitGoUTXO.address.fromBase58Check(verusAddress, 160).hash.toString('hex')
      return `0x${test2}`
    }

    function isRAddress (address) {
      if (!(/^R[1-9A-HJ-NP-Za-km-z]{33,34}$/).test(address)) {
        // check if it has the basic requirements of an address
        return false
      }
      return true

    }

    function isiAddress (address) {
      if (!(/^i[1-9A-HJ-NP-Za-km-z]{33,34}$/).test(address)) {
        // check if it has the basic requirements of an address
        return false
      }
      return true

    }

    function isETHAddress (address) {
      if (!(/^(0x)?[0-9a-f]{40}$/i).test(address)) {
        // check if it has the basic requirements of an address
        return false
      } else if ((/^(0x)?[0-9a-f]{40}$/).test(address) || (/^(0x)?[0-9A-F]{40}$/).test(address)) {
        // If it's all small caps or all all caps, return true
        return true
      }
    }


    sendETHButton.onclick = async () => {

      const contractAddress = SendETHAddress1.value
      const amount = SendETHAmount1.value
      const isETH = isETHAddress(contractAddress)
      const token = SendETHToken1.textContent
      
      let _destination = {};
      let _destinationType = {};
      let _feeCurrencyID = {};
      let _nFees = {};
      let _destSystemID = {};
      let flags =65;

      if (!isETH) {

        if (isiAddress(contractAddress)) {
          console.log('i address Valid: ', contractAddress)
          _destination = convertVerusAddressToEthAddress(contractAddress)
          console.log('Converted address ', _destination)
        } else if (isRAddress(contractAddress)) {
          console.log('R address Valid: ', contractAddress)
          _destination = convertVerusAddressToEthAddress(contractAddress)
          console.log('Converted address ', _destination)
        }

      }else{
        _destination = contractAddress;
      }

      //const etherAmount = web3.utils.toBN(SendETHAmount1.value)
      //const weiValue = web3.utils.toWei(etherAmount, 'ether')
      
      _destinationType = 4; // 4 for ID  and R is TODO:find what R address is
      _feeCurrencyID = "0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d"; // vrsctest
      _nFees =  2000000; //0.02 VRSC
      _destSystemID = "0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d"; // vrsctest


      try {

         let info = await verusBridge.methods.exportETH(_destination, _destinationType, _feeCurrencyID, _nFees, _destSystemID, flags)
         .send({from: ethereum.selectedAddress, gas: maxGas, value: web3.utils.toWei(SendETHAmount1.value, 'ether')});



      } catch (err) {
        console.error(err)
        
      }
    }




  }

  function handleNewAccounts (newAccounts) {
    accounts = newAccounts
    accountsDiv.innerHTML = accounts
    if (isMetaMaskConnected()) {
      initializeAccountButtons()
    }
    updateButtons()
  }

  function handleNewChain (chainId) {
    //chainIdDiv.innerHTML = chainId
  }

  function handleNewNetwork (networkId) {
   // networkDiv.innerHTML = 'VRSCTEST'
  }

  async function getNetworkAndChainId () {
    try {
      const chainId = await ethereum.request({
        method: 'eth_chainId',
      })
      handleNewChain(chainId)

      const networkId = await ethereum.request({
        method: 'net_version',
      })
      handleNewNetwork(networkId)
    } catch (err) {
      console.error(err)
    }
  }

  updateButtons()

  if (isMetaMaskInstalled()) {

    ethereum.autoRefreshOnNetworkChange = false
    getNetworkAndChainId()

    ethereum.on('chainChanged', handleNewChain)
    ethereum.on('networkChanged', handleNewNetwork)
    ethereum.on('accountsChanged', handleNewAccounts)

    if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      window.ethereum.enable();
  }

    
     verusBridge = new web3.eth.Contract(verusBridgeAbi, verusBridgeContractAdd)
    try {
      const newAccounts = await ethereum.request({
        method: 'eth_accounts',
      })
      handleNewAccounts(newAccounts)
    } catch (err) {
      console.error('Error on init when getting accounts', err)
    }
  }


}

window.addEventListener('DOMContentLoaded', initialize)


$('.dropdown-item').click(function () {

  $('#InputTokenLable').text($(this).text())

  console.log($(this).text())
})

$('.dropdown-item1').click(function () {

  $('#InputTokenLable1').text($(this).text())

  console.log($(this).text())
})
