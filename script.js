/* Educational demo only. Not a production inheritance vault. */
const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "digitalInheritanceVaultDemoV1";
let savedPackage = null;
let lastCheckin = null;
let state = "ACTIVE";
let graceStartedAt = null;
let recipient = "";

function log(message) {
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleString()} — ${message}`;
  $("auditLog").prepend(li);
}
function setStatus(id, message) { $(id).textContent = message; }
function setState(next) {
  state = next;
  const badge = $("stateBadge");
  badge.textContent = next;
  badge.className = "badge";
  if (next === "GRACE") badge.classList.add("grace");
  if (next === "RELEASED") badge.classList.add("released");
  setStatus("switchStatus", `Current switch state: ${next}.`);
}
function toBase64(bytes) {
  let binary = "";
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary);
}
function fromBase64(value) {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
async function deriveKey(passphrase, salt) {
  const material = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" },
    material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  );
}
function saveLocal() {
  const data = { savedPackage, lastCheckin, state, graceStartedAt, recipient };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function loadLocal() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!data) return;
    savedPackage = data.savedPackage || null;
    lastCheckin = data.lastCheckin || null;
    state = data.state || "ACTIVE";
    graceStartedAt = data.graceStartedAt || null;
    recipient = data.recipient || "";
    $("recipient").value = recipient;
    if (savedPackage) $("ciphertext").value = JSON.stringify(savedPackage, null, 2);
    if (lastCheckin) $("lastCheckin").textContent = new Date(lastCheckin).toLocaleString();
    setState(state);
    if (recipient) setStatus("recipientStatus", `Saved demo contact: ${recipient}`);
    setStatus("cryptoStatus", savedPackage ? "Encrypted package loaded from this browser." : "No encrypted note saved yet.");
  } catch {
    setStatus("cryptoStatus", "Could not load saved demo data.");
  }
}
$("encryptBtn").addEventListener("click", async () => {
  const plaintext = $("secret").value;
  const passphrase = $("passphrase").value;
  if (!plaintext || !passphrase) return setStatus("cryptoStatus", "Enter a sample note and passphrase first.");
  if (!window.crypto?.subtle) return setStatus("cryptoStatus", "Web Crypto is unavailable. Open this page in a modern browser via localhost or HTTPS.");
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
    savedPackage = {
      algorithm: "AES-256-GCM",
      kdf: "PBKDF2-SHA-256 (demo implementation)",
      salt: toBase64(salt),
      iv: toBase64(iv),
      ciphertext: toBase64(new Uint8Array(encrypted)),
      createdAt: new Date().toISOString()
    };
    $("ciphertext").value = JSON.stringify(savedPackage, null, 2);
    $("decrypted").value = "";
    saveLocal();
    setStatus("cryptoStatus", "Encrypted successfully. The browser stores ciphertext and parameters, not the plaintext note.");
    log("Sample note encrypted and saved locally.");
  } catch (error) {
    setStatus("cryptoStatus", `Encryption failed: ${error.message}`);
  }
});
$("decryptBtn").addEventListener("click", async () => {
  const passphrase = $("passphrase").value;
  if (!savedPackage) return setStatus("cryptoStatus", "Encrypt and save a sample note first.");
  if (!passphrase) return setStatus("cryptoStatus", "Enter the same demo passphrase used for encryption.");
  try {
    const key = await deriveKey(passphrase, fromBase64(savedPackage.salt));
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(savedPackage.iv) }, key, fromBase64(savedPackage.ciphertext)
    );
    $("decrypted").value = new TextDecoder().decode(plaintext);
    setStatus("cryptoStatus", "Decryption and authentication successful.");
    log("Sample note decrypted successfully.");
  } catch {
    $("decrypted").value = "";
    setStatus("cryptoStatus", "Decryption failed. Check the passphrase or verify that the encrypted package was not modified.");
    log("Decryption rejected: wrong passphrase or tampered package.");
  }
});
$("checkinBtn").addEventListener("click", () => {
  lastCheckin = new Date().toISOString();
  graceStartedAt = null;
  setState("ACTIVE");
  $("lastCheckin").textContent = new Date(lastCheckin).toLocaleString();
  setStatus("switchStatus", "Check-in recorded. Inactivity timer reset.");
  saveLocal(); log("Owner check-in recorded; timer reset.");
});
$("simulateBtn").addEventListener("click", () => {
  if (!lastCheckin) {
    lastCheckin = new Date(Date.now() - Number($("threshold").value) * 60000 - 1000).toISOString();
    $("lastCheckin").textContent = new Date(lastCheckin).toLocaleString();
  } else {
    lastCheckin = new Date(Date.now() - Number($("threshold").value) * 60000 - 1000).toISOString();
    $("lastCheckin").textContent = new Date(lastCheckin).toLocaleString();
  }
  graceStartedAt = new Date().toISOString();
  setState("GRACE");
  setStatus("switchStatus", "Simulated inactivity threshold reached. Grace period started; cancel or check in to stop the demo release.");
  saveLocal(); log("Inactivity simulated; state changed to GRACE.");
});
$("cancelBtn").addEventListener("click", () => {
  graceStartedAt = null;
  lastCheckin = new Date().toISOString();
  $("lastCheckin").textContent = new Date(lastCheckin).toLocaleString();
  setState("ACTIVE");
  setStatus("switchStatus", "Demo release cancelled. Vault returned to ACTIVE.");
  saveLocal(); log("Release cancelled; vault returned to ACTIVE.");
});
$("saveRecipientBtn").addEventListener("click", () => {
  recipient = $("recipient").value.trim();
  if (!recipient) return setStatus("recipientStatus", "Enter a contact label first.");
  setStatus("recipientStatus", `Saved demo contact: ${recipient}. No notification is sent.`);
  saveLocal(); log(`Trusted contact label saved: ${recipient}.`);
});
$("clearBtn").addEventListener("click", () => {
  if (!confirm("Clear this project's demo data from this browser?")) return;
  localStorage.removeItem(STORAGE_KEY);
  savedPackage = null; lastCheckin = null; state = "ACTIVE"; graceStartedAt = null; recipient = "";
  $("secret").value = ""; $("passphrase").value = ""; $("ciphertext").value = ""; $("decrypted").value = "";
  $("recipient").value = ""; $("lastCheckin").textContent = "Not checked in"; $("elapsed").textContent = "—";
  $("auditLog").innerHTML = ""; setState("ACTIVE");
  setStatus("cryptoStatus", "Demo data cleared."); setStatus("recipientStatus", "No contact saved.");
  log("Demo data cleared.");
});
function updateElapsed() {
  if (!lastCheckin) { $("elapsed").textContent = "—"; return; }
  const elapsedMs = Date.now() - new Date(lastCheckin).getTime();
  const mins = Math.max(0, Math.floor(elapsedMs / 60000));
  $("elapsed").textContent = mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} hr ${mins % 60} min`;
  const thresholdMs = Number($("threshold").value) * 60000;
  if (state === "ACTIVE" && elapsedMs >= thresholdMs) {
    graceStartedAt = new Date().toISOString();
    setState("GRACE");
    setStatus("switchStatus", "Inactivity threshold reached. Grace period started in this demo.");
    log("Timer reached threshold; state changed to GRACE.");
    saveLocal();
  }
  // Short grace period is simulated as one minute for demonstration purposes.
  if (state === "GRACE" && graceStartedAt && Date.now() - new Date(graceStartedAt).getTime() >= 60000) {
    setState("RELEASED");
    setStatus("switchStatus", `Demo package marked RELEASED for ${recipient || "the configured recipient"}; this prototype does not send or expose a real package.`);
    log("Demo grace period expired; state changed to RELEASED.");
    saveLocal();
  }
}
$("threshold").addEventListener("change", () => { log(`Demo threshold set to ${$("threshold").value} minutes.`); });
loadLocal();
setInterval(updateElapsed, 5000);
updateElapsed();
