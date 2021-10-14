// import bitGoUTXO from  'bitgo-utxo-lib'
import { encrypt } from 'eth-sig-util'
import MetaMaskOnboarding from '@metamask/onboarding'
import Web3 from 'web3'

const bitGoUTXO = require('./bitUTXO')
const verusBridgeAbi = require('./VerusBridgeAbi.json')
const ERC20Abi = require('./ERC20Abi.json')
const NOTARIZERAbi = require('./Notarizerabi.json')
const gist = document.getElementById('file-gistfile1-txt-LC1');

const gistdata = JSON.parse(gist.textContent);
const verusBridgeContractAdd = gistdata? gistdata.bridge : "";
let USDCERC20Add = gistdata? gistdata.USDC : ""; //'0xeb8f08a975ab53e34d8a0330e0d34de942c95926'
let VRSTERC20 = gistdata? gistdata.vrst : ""; //"0x94186e62590d82ef5cbfd89323d3da20c7153afb" 
let BETHERC20 = gistdata? gistdata.beth : "";
let VERUSNOTARIZER = gistdata? gistdata.notarizer : "";
let BRIDGEVETH = gistdata? gistdata.bridgeveth : ""; 

let maxGas = 6000000;
let poolavailable = false;


const currentUrl = new URL(window.location.href)

const forwarderOrigin = currentUrl.hostname === 'localhost'
  ? 'http://localhost:9010'
  : undefined

const isMetaMaskInstalled = () => {
  const { ethereum } = window
  return Boolean(ethereum && ethereum.isMetaMask)
}

// Dapp Status Section
const accountsDiv = document.getElementById('accounts')

// Basic Actions Section
const onboardButton = document.getElementById('connectButton')
const accountadd = document.getElementById('accountadd')

// Send Eth Section
const sendETHButton = document.getElementById('sendETHButton')
const AuthoriseCoinsButton = document.getElementById('AuthoriseCoins')
const SendETHAddress1 = document.getElementById('InputToken1')
const SendETHAmount1 = document.getElementById('Inputamount1')
const inputGroupSelect01 = document.getElementById('inputGroupSelect01')
const inputGroupSelect02 = document.getElementById('inputGroupSelect02')
const poollaunchedtext = document.getElementById('poollaunched')

// Send Tokens Section

const mintUSDCTokens = document.getElementById('mintUSDCbutton');
const mintUSDCAmount = document.getElementById('mintUSDCAmount');
const AuthUSDCbutton = document.getElementById('AuthUSDCbutton');
const AuthUSDCAmount = document.getElementById('AuthUSDCAmount');

const mintedUSDMSG = document.getElementById('MintedUSDMSG');



const initialize = async () => {InputToken1

 

  let onboarding
  try {
    onboarding = new MetaMaskOnboarding({ forwarderOrigin })
  } catch (error) {
    console.error(error)
  }

  let accounts

  let accountButtonsInitialized = false

  const accountButtons = [

    mintUSDCTokens,
    AuthUSDCbutton

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

  accountadd.innerText = " Not Connected";


  }


  const updateButtons = () => {
    const accountButtonsDisabled = !isMetaMaskInstalled() || !isMetaMaskConnected()
    if (accountButtonsDisabled) {
      for (const button of accountButtons) {
       // button.disabled = true   
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
      onboardButton.innerText = 'Connected to MetaMask'
      onboardButton.disabled = true
      sendETHButton.disabled = false
      AuthoriseCoinsButton.disabled = false
     // mintUSDCTokens.disabled = false  
     // AuthUSDCbutton.disabled = false 

      if (onboarding) {
        onboarding.stopOnboarding()
      }

    } else {
      onboardButton.innerText = 'Connect to MetaMask'
      onboardButton.onclick = onClickConnect
      onboardButton.disabled = false
      sendETHButton.disabled = true
      AuthoriseCoinsButton.disabled = true
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
      const test2 = bitGoUTXO.address.fromBase58Check(verusAddress, 102).hash.toString('hex')
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

 /*   mintUSDCTokens.onclick = async () => {

      const amount = mintUSDCAmount.value

      if(isNaN(amount) || amount == ""){
        alert(`Not a valid amount, amount: ${amount}`);
        return;
      }

     // mintedUSDMSG.innerHTML = "USDC Minted, Add 0xeb8f08a975ab53e34d8a0330e0d34de942c95926 token to your metamask to see your balance ";
      var accounts = await web3.eth.getAccounts();
      const tokenInst = new web3.eth.Contract(ERC20Abi, USDCERC20Add);  


      try{
        await tokenInst.methods.mint(accounts[0],amount) 
        .send({from: ethereum.selectedAddress, gas: maxGas});

        await tokenInst.methods.increaseAllowance(verusBridgeContractAdd,amount) 
        .send({from: ethereum.selectedAddress, gas: maxGas});
       
        }
        catch (err){
      console.error(err)
          
        }

    }

    AuthUSDCbutton.onclick = async () => {
 
      const amount = AuthUSDCAmount.value

      if(isNaN(amount) || amount == ""){
        alert(`Not a valid amount, amount: ${amount}`);
        return;
      }

     // mintedUSDMSG.innerHTML = "USDC Minted, Add 0xeb8f08a975ab53e34d8a0330e0d34de942c95926 token to your metamask to see your balance ";
      var accounts = await web3.eth.getAccounts();
      const tokenInst = new web3.eth.Contract(ERC20Abi, USDCERC20Add);  


      try{
         await tokenInst.methods.increaseAllowance(verusBridgeContractAdd,amount) 
        .send({from: ethereum.selectedAddress, gas: maxGas});
       
        }
        catch (err){
      console.error(err)
      alert("Metamask end failed, reason: \n" + JSON.stringify(err));
        }

      
    }*/

    const removeHexLeader = (hexString) => {
      if(hexString.substr(0,2) == '0x') return hexString.substr(2);
      else return hexString;
    }

    AuthoriseCoinsButton.onclick = async () => {
    try{
      const tokenInst1 = new web3.eth.Contract(ERC20Abi, USDCERC20Add);
      await tokenInst1.methods.increaseAllowance(verusBridgeContractAdd,"1000000000000000000000000") 
      .send({from: ethereum.selectedAddress, gas: maxGas});

      const tokenInst2 = new web3.eth.Contract(ERC20Abi, VRSTERC20);
      await tokenInst2.methods.increaseAllowance(verusBridgeContractAdd,"1000000000000000000000000") 
      .send({from: ethereum.selectedAddress, gas: maxGas});

      const tokenInst3 = new web3.eth.Contract(ERC20Abi, BETHERC20);
      await tokenInst3.methods.increaseAllowance(verusBridgeContractAdd,"1000000000000000000000000") 
      .send({from: ethereum.selectedAddress, gas: maxGas});

    }catch(err){
      console.error(err);
      console.log(err);
    }
      alert("Your Rinkeby account has authorised USDC, VRSCTEST & bridge.veth tokens");
    }

    sendETHButton.onclick = async () => {

      const contractAddress = SendETHAddress1.value
      const amount = SendETHAmount1.value
      const token = inputGroupSelect01.value
      const destination = inputGroupSelect02.value
      const verusBridge = new web3.eth.Contract(verusBridgeAbi, verusBridgeContractAdd)
      let destinationtype = {};
      let flagvalue = 65;
      let bridgeHex = convertVerusAddressToEthAddress("iSojYsotVzXz4wh2eJriASGo6UidJDDhL2");
      let secondreserveid = "0x0000000000000000000000000000000000000000"
      let destinationcurrency = "ETH";

      let currency = {
        VRSCTEST: "0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d",
        ETH: "0x67460C2f56774eD27EeB8685f29f6CEC0B090B00",
        USDC: "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
        bridge: bridgeHex,
      }
      var accounts = await web3.eth.getAccounts();
      var accbal = await web3.eth.getBalance(accounts[0]);

      accbal = web3.utils.fromWei(accbal);
      accbal = parseFloat(accbal);
      try {
      //deal with valid information in the input fields
      if(token == 'Choose...'){
        alert("Please choose a Token");
        return;
      }
      // check that user has enough in their account
      if(isNaN(amount)){
        alert(`Not a valid amount, amount: ${amount}`);
        return;

      }else if(token == 'ETH' && accbal < parseFloat(amount)){
        alert(`Not enough ETH in account, balance: ${accbal}`);
        return;
      }else if(token == 'USDC'){
        const tokenInst = new web3.eth.Contract(ERC20Abi, USDCERC20Add);
        let balance = await tokenInst.methods.balanceOf(accounts[0]).call()
        let decimals = await tokenInst.methods.decimals().call();

        balance = balance / ( 10 ** decimals );
          if(balance < parseFloat(amount) ){
            alert(`Not enough ${token} in account, balance: ${balance}`);
            return;
          }
      }else if(token == 'VRSCTEST'){
        const tokenInst = new web3.eth.Contract(ERC20Abi, VRSTERC20);
        let balance = await tokenInst.methods.balanceOf(accounts[0]).call()
        let decimals = await tokenInst.methods.decimals().call();

        balance = balance / ( 10 ** decimals );
          if(balance < parseFloat(amount) ){
            alert(`Not enough ${token} in account, balance: ${balance}`);
            return;
          }
      }else if(token == 'bridge'){
        const tokenInst = new web3.eth.Contract(ERC20Abi, BETHERC20);
        let balance = await tokenInst.methods.balanceOf(accounts[0]).call()
        let decimals = await tokenInst.methods.decimals().call();

        balance = balance / ( 10 ** decimals );
          if(balance < parseFloat(amount) ){
            alert(`Not enough ${token} in account, balance: ${balance}`);
            return;
          }
      }

      let destinationaddress = {};
      //set destination to correct type
      if (isiAddress(contractAddress)) {
        destinationtype = 4; //ID TYPE
        destinationaddress = convertVerusAddressToEthAddress(contractAddress)
      } else if (isRAddress(contractAddress)) {
        destinationtype = 2; //R TYPE
        destinationaddress = convertVerusAddressToEthAddress(contractAddress)
      }else if (isETHAddress(contractAddress)) {
        destinationtype = 9; //ETH TYPE
        destinationaddress = contractAddress
      }else {
        alert("Not a valid i / R or ETH address");
        return;
      }
      if(destination == 'Choose...'){
        alert("Please Choose a destination type"); //add in FLAGS logic for destination
        return; 
      }

      if((destination == 'vrsctest' || destination == 'bridge') && destinationtype == 9){
        alert("Cannot send direct to ETH address, must convert and bounce back"); //add in FLAGS logic for destination
        return; 
      }

      if(destination == "bridge" && token != 'bridge' ){
         flagvalue = 67;
        destinationcurrency = "bridge";
      }else if (destination == "bridge" && token == 'bridge' ){
        alert("Cannot convert bridge to bridge, must be sent direct"); //add in FLAGS logic for destination
        return; 
      }

      if((destination == "swaptoBRIDGE") && (token != 'bridge') || destination == "swaptoVRSCTEST" ){
        if(destinationtype != 9){
          alert("Destination must be ETH type address"); //add in FLAGS logic for destination
          return; 
        }
        flagvalue = 67;
        destinationcurrency = "bridge";
        destinationtype = destinationtype + 128;

        //to do a swap we need to append the gatewayID + gateway code + fees
        destinationaddress += "67460C2f56774eD27EeB8685f29f6CEC0B090B00" + "0000000000000000000000000000000000000000" + "e093040000000000"
        if(destination == "swaptoVRSCTEST"){
          secondreserveid = currency.VRSCTEST;
          flagvalue = 67 + 1024;  //VALID + CONVERT + RESERVE_TO_RESERVE 
        }
      }else if (destination == "swaptoBRIDGE" && token == 'bridge') {
        alert("Cannot convert bridge to bridge, must be sent direct"); //add in FLAGS logic for destination
        return; 

      }

      if(amount == 0 || amount == '' ){
        alert("Please Set an amount");  //todo validate length e.g. 100000.00000000
        return;
      }

      if( poolavailable == "0"){
        if(destination == "swaptoBRIDGE" || destination == "swaptoVRSCTEST" || destination == "bridge"){
          alert("Bridge.veth not launched yet, send only direct until launch complete"); //add in FLAGS logic for destination
          return; 
        }
      }else if( poolavailable != "0"){
        if(destination == 'vrsctest'){
          alert("Bridge open, must go through bridge converter as fee subsidies are not available"); //add in FLAGS logic for destination
          return; 
        }
      }

      let feecurrency = {};
      let fees = {};
      if(poolavailable != "0" ){
        feecurrency = currency.ETH;
        fees = 30000; //0.0003 ETH FEE
      }else{
        feecurrency = currency.VRSCTEST; //pre bridge launch fees must be set as vrsctest
        fees = 20000000  // 0.02 VRSCTEST
      }
      

      let verusAmount = (amount * 100000000);
      let CReserveTransfer =  {
        version : 1,
        currencyvalue : {currency: currency[token] , amount: verusAmount.toFixed(0)}, //currency sending from ethereum
        flags : flagvalue,
        feecurrencyid : feecurrency, //fee is vrsctest pre bridge launch, veth or others post.
        fees : fees,
        destination : {destinationtype, destinationaddress}, //destination address currecny is going to
        destcurrencyid : currency[destinationcurrency],   // destination currency is veth on direct. bridge.veth on bounceback
        destsystemid : currency.VRSCTEST,     // destination system going to can only be VRSCTEST
        secondreserveid : secondreserveid    //used as return currency type on bounce back
        }
        var date = new Date();
        var n = date.toDateString();
        var time = date.toLocaleTimeString();
        console.log("Transaction output: ",`Date: ${n} Time: ${time}`);
 
        console.log(CReserveTransfer);

      let result = await verusBridge.methods.export(CReserveTransfer)
          .send({from: ethereum.selectedAddress, gas: maxGas, value: web3.utils.toWei(token == 'ETH' ? amount : '0.0006', 'ether')});
        
      } catch (err) {
          console.log(err)
    }
   }
  }

  const checkBridgeLaunched = async () => {
    try {

      const NotarizerInst = new web3.eth.Contract(NOTARIZERAbi, VERUSNOTARIZER);
      poolavailable = await NotarizerInst.methods.poolAvailable(BRIDGEVETH).call()
      let lastProof = await  NotarizerInst.methods.getLastProofRoot().call();
      poollaunchedtext.innerText = (poolavailable != "0"  ? "Bridge.veth currency Launched" : "Bridge.veth currency not launched" ) + "\n Last VerusTest Notary height: " + lastProof.rootheight;
 
    } catch (err) {
      console.error(err)
    }
  }

  function handleNewAccounts (newAccounts) {
    accounts = newAccounts
    accountsDiv.innerHTML = accounts
    if (isMetaMaskConnected()) {
      initializeAccountButtons()
      checkBridgeLaunched()
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

window.addEventListener('DOMContentLoaded', initialize);

(function () {
  var old = console.log;
  var logger = document.getElementById('log');
  console.log = function () {
    for (var i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] == 'object') {
          logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(arguments[i], undefined, 2) : arguments[i]) + '<br />';
      } else {
          logger.innerHTML += arguments[i] + '<br />';
      }
    }
  }
})();