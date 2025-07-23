// Config
const CONTRACT = "0xE488253DD6B4D31431142F1b7601C96f24Fb7dd5";
const ABI = [ /* ... full ABI matching Sourcify ... */ ];
const FEE = '0.0015'; // BNB

// App state
let web3, provider, contract, account;

// DOM
const btn = document.getElementById("claimButton");
const cooldownInfo = document.getElementById("cooldownInfo");
const keyInfo = document.getElementById("keyInfo");
const priceInfo = document.getElementById("priceInfo");

async function fetchPrice() {
  try {
    const res = await fetch("TIFFY-Market-Value/price.json");
    const d = await res.json();
    priceInfo.textContent = `💰 ${d.tiffyToUSD} USD / ${d.tiffyToWBNB} WBNB`;
  } catch {
    priceInfo.textContent = "Price unavailable";
  }
}

async function connectWallet() {
  const opts = { 
    walletconnect: {
      package: window.WalletConnectProvider.default,
      options: {
        projectId: "bf...",
        chains: [56],
        rpcMap: {56: "https://bsc-dataseed.binance.org/"},
        showQrModal: true
      }
    }
  };
  const modal = new Web3Modal.default({ cacheProvider: true, providerOptions: opts });
  provider = await modal.connect();
  web3 = new Web3(provider);
  const ch = await web3.eth.getChainId();
  if (ch !== 56) {
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });
    } catch { return alert("Please switch to BSC manually."); }
  }
  const accts = await web3.eth.getAccounts();
  account = accts[0];
  contract = new web3.eth.Contract(ABI, CONTRACT);

  btn.disabled = false;
  cooldownInfo.textContent = "✅ Wallet connected";
  initClaimLoop();
}

async function checkCooldown() {
  if (!contract || !account) return;
  try {
    const last = await contract.methods.lastClaimed(account).call();
    const rem = parseInt(last) + 86400 - Math.floor(Date.now() / 1000);
    if (rem <= 0) {
      cooldownInfo.textContent = "✅ Ready to claim!";
      btn.disabled = false;
      btn.classList.remove("cooldown");
    } else {
      btn.disabled = true;
      btn.classList.add("cooldown");
      const h = Math.floor(rem / 3600);
      const m = Math.floor((rem % 3600) / 60);
      const s = rem % 60;
      cooldownInfo.textContent = `⏳ Next claim: ${h}h ${m}m ${s}s`;
    }
  } catch {
    cooldownInfo.textContent = "Error checking cooldown";
  }
}

async function claim() {
  try {
    btn.disabled = true;
    const feeExempt = await contract.methods.isFeeExempt(account).call();
    const opts = feeExempt ? { from: account } : {
      from: account,
      value: web3.utils.toWei(FEE, "ether")
    };
    await contract.methods.claim().send(opts);
    const newKeys = (parseInt(localStorage.getItem("tiffyBlueKeys")) || 0) + 1;
    localStorage.setItem("tiffyBlueKeys", newKeys);
    keyInfo.textContent = `🔹 Blue Keys: ${newKeys}`;
    alert("✅ Claimed! +1 Blue Key");
    checkCooldown();
  } catch (e) {
    console.error(e);
    alert("❌ Claim failed: " + (e.message || e));
    checkCooldown();
  }
}

function initClaimLoop() {
  updateKeyDisplay();
  setInterval(checkCooldown, 30_000);
}

function updateKeyDisplay() {
  const k = parseInt(localStorage.getItem("tiffyBlueKeys")) || 0;
  keyInfo.textContent = `🔹 Blue Keys: ${k}`;
}

// App init
window.addEventListener("load", () => {
  fetchPrice();
  btn.addEventListener("click", claim);
  connectWallet().catch(console.error);
  setInterval(fetchPrice, 60000);
});
