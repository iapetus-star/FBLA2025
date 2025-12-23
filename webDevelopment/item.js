// SUPABASE SETUP
const SUPABASE_URL = "https://aynvmshmrcxcccglxcdk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bnZtc2htcmN4Y2NjZ2x4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNzEzMjgsImV4cCI6MjA4MTg0NzMyOH0.JAShR_lIGbv7MVUaiMf5qm1ufEFTXbwL6Rs4R1CYL-M";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// DOM
const container = document.getElementById("itemContainer");

// GET ITEM ID FROM URL
const params = new URLSearchParams(window.location.search);
const itemId = params.get("id");

if (!itemId) {
  container.innerHTML = "<p>Item not found.</p>";
} else {
  fetchItem(itemId);
}

// FETCH ITEM
async function fetchItem(id) {
  const { data, error } = await supabaseClient
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    container.innerHTML = "<p>Unable to load item.</p>";
    console.error(error);
    return;
  }

  renderItem(data);
}

// RENDER ITEM
function renderItem(item) {
  const statusText =
    item.status === "lost" ? "Lost" :
    item.status === "found" ? "Found" :
    "Claimed";

  const instructions =
    item.status === "found"
      ? "Visit the main office with your school ID to claim this item."
      : item.status === "lost"
      ? "If you have found this item, please turn it in to the main office."
      : "This item has already been claimed.";

  container.innerHTML = `
    <div class="item-detail-image" style="
      background-image: url('${item.image_url || ""}');
    "></div>

    <h2>${item.name}</h2>
    <div class="badge ${item.status}">${statusText}</div>

    <div class="item-meta">
      Category: ${item.category || "Other"} •
      Location: ${item.location || "Unknown"} •
      Date: ${item.date_lost || item.date_found || "—"}
    </div>

    <div class="item-description">
      ${item.description || "No description provided."}
    </div>

    <div class="info-box">
      ${instructions}
    </div>

    ${
      item.status !== "claimed"
        ? `<div class="item-actions">
            <a href="mailto:office@yourschool.edu?subject=Lost%20Item%20Inquiry"
               class="btn primary">
              This looks like mine
            </a>
          </div>`
        : ""
    }
  `;
}
