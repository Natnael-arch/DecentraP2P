const abi = [
  "function stablecoin() view returns (address)",
  "function orderCounter() view returns (uint256)",
  "function getOrder(uint256 orderId) view returns (tuple(address seller,address buyer,uint256 amount,uint256 price,uint256 timeoutPeriod,uint256 timeoutTimestamp,uint8 status))",
  "function createListing(uint256 amount,uint256 price,uint256 timeoutPeriod,address buyer) returns (uint256)",
  "function lockFunds(uint256 orderId)",
  "function markPaid(uint256 orderId)",
  "function confirmPayment(uint256 orderId)",
  "function triggerRefund(uint256 orderId)",
];

const erc20Abi = [
  "function approve(address spender,uint256 amount) returns (bool)",
  "function allowance(address owner,address spender) view returns (uint256)",
];

let provider;
let signer;
let contract;
let contractAddress;

const statusLabels = ["None", "Created", "Locked", "PaidMarked", "Released", "Refunded"];

const connectButton = document.getElementById("connectButton");
const setContractBtn = document.getElementById("setContractBtn");
const createBtn = document.getElementById("createBtn");
const markPaidBtn = document.getElementById("markPaidBtn");
const releaseBtn = document.getElementById("releaseBtn");
const refundBtn = document.getElementById("refundBtn");
const refreshBtn = document.getElementById("refreshBtn");
const logOutput = document.getElementById("logOutput");
const ordersBody = document.getElementById("ordersBody");
const connectionStatus = document.getElementById("connectionStatus");

function log(message) {
  const now = new Date().toLocaleTimeString();
  logOutput.textContent = `[${now}] ${message}\n${logOutput.textContent}`;
}

async function connectWallet() {
  if (!window.ethereum) {
    alert("Install MetaMask or an Arc-compatible wallet.");
    return;
  }
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  connectionStatus.textContent = `Connected: ${await signer.getAddress()}`;
  log("Wallet connected");
}

async function setContract() {
  if (!signer) {
    await connectWallet();
  }
  contractAddress = document.getElementById("escrowAddress").value.trim();
  if (!contractAddress) {
    alert("Enter a contract address");
    return;
  }
  contract = new ethers.Contract(contractAddress, abi, signer);
  log(`Contract set to ${contractAddress}`);
  await refreshOrders();
}

async function ensureAllowance(amount) {
  const stablecoin = await contract.stablecoin();
  const erc20 = new ethers.Contract(stablecoin, erc20Abi, signer);
  const owner = await signer.getAddress();
  const allowance = await erc20.allowance(owner, contractAddress);
  if (allowance < amount) {
    const tx = await erc20.approve(contractAddress, amount);
    log("Approving stablecoin spend...");
    await tx.wait();
    log("Stablecoin approved");
  }
}

async function createListing() {
  try {
    const buyer = document.getElementById("buyerInput").value.trim();
    const amountInput = document.getElementById("amountInput").value;
    const priceInput = document.getElementById("priceInput").value;
    const timeoutInput = document.getElementById("timeoutInput").value;
    if (!buyer || !amountInput || !priceInput || !timeoutInput) {
      alert("Fill every field.");
      return;
    }
    const amount = ethers.parseUnits(amountInput, 6);
    const price = ethers.parseUnits(priceInput, 6);
    const timeout = Number(timeoutInput);

    const tx = await contract.createListing(amount, price, timeout, buyer);
    log("Creating listing...");
    const receipt = await tx.wait();
    const event = receipt.logs
      .map((log) => {
        try {
          return contract.interface.parseLog(log);
        } catch (err) {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === "ListingCreated");

    const orderId = event?.args?.orderId;
    log(`Listing ${orderId} created, locking funds...`);

    await ensureAllowance(amount);
    const lockTx = await contract.lockFunds(orderId);
    await lockTx.wait();
    log(`Order ${orderId} locked`);
    await refreshOrders();
  } catch (err) {
    console.error(err);
    alert(err.message ?? err);
  }
}

async function markPaid() {
  try {
    const orderId = document.getElementById("markOrderInput").value;
    const tx = await contract.markPaid(orderId);
    await tx.wait();
    log(`Order ${orderId} marked as paid`);
    await refreshOrders();
  } catch (err) {
    console.error(err);
    alert(err.message ?? err);
  }
}

async function releaseFunds() {
  try {
    const orderId = document.getElementById("releaseOrderInput").value;
    const tx = await contract.confirmPayment(orderId);
    await tx.wait();
    log(`Order ${orderId} released`);
    await refreshOrders();
  } catch (err) {
    console.error(err);
    alert(err.message ?? err);
  }
}

async function refundOrder() {
  try {
    const orderId = document.getElementById("refundOrderInput").value;
    const tx = await contract.triggerRefund(orderId);
    await tx.wait();
    log(`Refund triggered for ${orderId}`);
    await refreshOrders();
  } catch (err) {
    console.error(err);
    alert(err.message ?? err);
  }
}

function formatAmount(amount) {
  return Number(ethers.formatUnits(amount, 6)).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

async function refreshOrders() {
  if (!contract) return;
  const total = await contract.orderCounter();
  const rows = [];

  for (let i = 1n; i <= total; i++) {
    const order = await contract.getOrder(i);
    rows.push(`
      <tr>
        <td>${i}</td>
        <td>${order.seller}</td>
        <td>${order.buyer}</td>
        <td>${formatAmount(order.amount)} USDC</td>
        <td>${statusLabels[Number(order.status)]}</td>
        <td>${order.timeoutTimestamp > 0 ? new Date(Number(order.timeoutTimestamp) * 1000).toLocaleString() : "-"}</td>
      </tr>
    `);
  }

  ordersBody.innerHTML = rows.join("") || `<tr><td colspan="6">No listings yet</td></tr>`;
}

connectButton.addEventListener("click", connectWallet);
setContractBtn.addEventListener("click", setContract);
createBtn.addEventListener("click", createListing);
markPaidBtn.addEventListener("click", markPaid);
releaseBtn.addEventListener("click", releaseFunds);
refundBtn.addEventListener("click", refundOrder);
refreshBtn.addEventListener("click", refreshOrders);

