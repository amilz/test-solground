//~~~IMPORTS 
import * as solanaWeb3 from '@solana/web3.js';
import Wallet from '@project-serum/sol-wallet-adapter';
import { Connection, SystemProgram, Transaction, clusterApiUrl, LAMPORTS_PER_SOL, Cluster } from '@solana/web3.js';



//~~~VARIABLES
let netselect = 'devnet'; //mainnet-beta OR devnet
let status = 'disconnected';//use this to toggle 
let solletwallet = new Wallet('https://www.sollet.io');
let connectedWalletID = ''; //public wallet ID of connected wallet
let connectedWalletType = ''; //phantom or sollet


//~~~FORMULAS
const SOLsearch = async function (item,index,arry) { 
  let conn = new solanaWeb3.Connection(clusterApiUrl(netselect)); //mainnet-beta //devnet
  const pubkey = new solanaWeb3.PublicKey(item);
  const balance = await conn.getBalance(pubkey) / LAMPORTS_PER_SOL; 
  console.log('balance captured from: ' + clusterApiUrl(netselect));
  console.log('Balance : '+ balance + ' SOL');
  return balance;
}

//run on any connection (after the .on)
const connectWallet = async (wallettype) => {
  connectedWalletType = wallettype;
  status='connected';
  console.log("Connected to: "+connectedWalletID); //prints wallet ID
  document.getElementById("connectedwalletfield").innerHTML = "";    
  toggleConnectButton(status);
  let solbalance = await SOLsearch(connectedWalletID);  
  //document.getElementById("connectedwalletfield").innerHTML += "$SOL Balance: " + solbalance;
  document.getElementById("sendbox").style.display = "block";
  document.getElementById("fromWallet").value = 'FoZ1TbVp5aRv1xcSL4bf79zQrC87iAkg9VxVfj9pRhQc'; 
  document.getElementById("current-balance").value = "$SOL Balance: " + solbalance;
 
}


//discconect function
const disconnectWallet = async () => {
  console.log('Disconnected');
  status = 'disconnected';
  connectedWalletType = '';
  toggleConnectButton(status);
  document.getElementById("connectedwalletfield").innerHTML = "Disconnected from "+connectedWalletID+"!";
  document.getElementById("sendbox").style.display = "none";      
};

const dummyWalletGen = () => {
  document.getElementById("toWallet").value = '77z6mutuJsUpTa8nsoiUGVv4wan9u1pNbL527zbWJNLF'; 
}
document.getElementById("toWallet").onclick =  () => {
  dummyWalletGen();
}

//~~~BUTTONS
let toggleConnect= false; //toggle value for connect button

// Connect Wallet Button opens up the list of options (or closes options)
document.getElementById("connectbutton").onclick =  () => {
  if (!toggleConnect){
    document.getElementById("connectPop").style.display = "block";
    toggleConnect= true;
  }
  else {
    closeConnect();
  }
} 

//this will switch connect to DC (and vis versa) when connected/disconnected); must define status and call it into this function
const toggleConnectButton = (currentstatus) => {
  if (currentstatus === 'connected'){
    document.getElementById("connectbutton").style.display = "none";
    document.getElementById("disconnectbutton").style.display = "block"; 
  }
  else {
    document.getElementById("connectbutton").style.display = "block";
    document.getElementById("disconnectbutton").style.display = "none"; 
  }
}

//phantom button 
document.getElementById("phantombutton").onclick = async () => {
  closeConnect(); //close the popup
  //disconnectWallet(); // first DC anything that's open
  await window.solana.connect(); //connect to phantom
}
//sollet button
document.getElementById("solletbutton").onclick = async () => {
  closeConnect(); //close the popup
  //disconnectWallet(); // first DC anything that's open
  await solletwallet.connect(); //connect to sollet
}

//disconnect button
document.getElementById("disconnectbutton").onclick =  async () => {
  //disconnect sollet 
  await solletwallet.disconnect();
  //disconnect phantom
  await window.solana.disconnect();
}

//hide the connect wallet pop-up
const closeConnect = () =>{
  document.getElementById("connectPop").style.display = "none";
  toggleConnect= false; 
}

// Network Select Button
document.getElementById("net-toggle").onclick =  () => {
  closeConnect();
  //disconnect sollet 
  solletwallet.disconnect();
  //disconnect phantom
  window.solana.disconnect();
  if (netselect === 'devnet'){
    document.getElementById("net-toggle").innerHTML = "Main Net"
    netselect = 'mainnet-beta';
  }
  else {
    document.getElementById("net-toggle").innerHTML = "Dev Net"
    netselect = 'devnet';
  }
} 


//~~~WALLET ON.CONNECTS

//sollet connection
solletwallet.on('connect',  async (publicKey)  =>  {
  connectedWalletID = publicKey.toBase58();
  connectWallet('sollet');
  
  }
);
solletwallet.on('disconnect', () => {
  disconnectWallet();
  }
);

//phantom - check that phantom is installed
const isPhantomInstalled = window.solana && window.solana.isPhantom; 
const getProvider = () => {
    if ("solana" in window) {
      const provider = window.solana;
      if (provider.isPhantom) {
        return provider;
        console.log(provider);
      }
    }
    window.open("https://phantom.app/", "_blank");
};


//phantom connection 
// (need to chat w/ austin or dev team getting error about .on sometimes)
/*window.solana.on("connect", async () => {
  connectedWalletID = window.solana.publicKey.toString(); //defines the public walletID
  connectWallet('phantom');

});

window.solana.on('disconnect', async () => {
  await disconnectWallet();
});
*/

setTimeout(function () {
  window.solana.on("connect", () => 
    {
    connectedWalletID = window.solana.publicKey.toString(); //defines the public walletID
    connectWallet('phantom');
    }); 
  window.solana.on('disconnect', async () => {
    await disconnectWallet();
  });
}, 3000);




//~~~TRANSACTIONS

//sollet
const solletsend = async () =>{
  let conn = new solanaWeb3.Connection(clusterApiUrl(netselect)); //mainnet-beta //devnet
  let toWallet = document.getElementById("toWallet").value;
  let sendAmt = document.getElementById("sendamt").value * LAMPORTS_PER_SOL; //number of lamports to send
  let sendType = document.getElementById("token").value; //token to send (default solana)

  let transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: solletwallet.publicKey,
      toPubkey: new solanaWeb3.PublicKey(toWallet),
      lamports: sendAmt,
    })
  );
  let { blockhash } = await conn.getRecentBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = solletwallet.publicKey;
  let signed = await solletwallet.signTransaction(transaction);
  let txid = await conn.sendRawTransaction(signed.serialize());
  let txConfirm = await conn.confirmTransaction(txid);
  console.log(txConfirm);
}

document.getElementById("submit-button").onclick = async () =>{

  //if (document.getElementById("sendamt").value * LAMPORTS_PER_SOL > balance){}
  if (connectedWalletType==="sollet"){
    solletsend();
  }
  else if (connectedWalletType==="phantom"){
    phantomsend();
  }
  else {console.error();}

}

//phantom send
const phantomsend = async () => {
  let conn = new solanaWeb3.Connection(clusterApiUrl(netselect)); //mainnet-beta //devnet
  let toWallet = document.getElementById("toWallet").value;
  let sendAmt = document.getElementById("sendamt").value * LAMPORTS_PER_SOL; //number of lamports to send
  let sendType = document.getElementById("token").value; //token to send (default solana)

  let transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: window.solana.publicKey,
      toPubkey: new solanaWeb3.PublicKey(toWallet),
      lamports: sendAmt,
    })
  );
  let { blockhash } = await conn.getRecentBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = window.solana.publicKey;
  let signed = await window.solana.signTransaction(transaction);
  let txid = await conn.sendRawTransaction(signed.serialize());
  let txConfirm = await conn.confirmTransaction(txid);
  console.log(txConfirm);
}

/* 



phantom!
need to respond to the transaction promise. e.g. (tx confirmed!; update balance; )
need to add responsive "not enough balance and do not allow click if balance too low"
possibly some logic to prevent clicking based on those values. need to make a balance global variable or pass results somewhere

*/