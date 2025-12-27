// SUPABASE SETUP
const SUPABASE_URL = "https://aynvmshmrcxcccglxcdk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bnZtc2htcmN4Y2NjZ2x4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNzEzMjgsImV4cCI6MjA4MTg0NzMyOH0.JAShR_lIGbv7MVUaiMf5qm1ufEFTXbwL6Rs4R1CYL-M";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// DOM ELEMENT
const grid = document.getElementById("items-grid");

// HELPER: Capitalizes the first letter of each word
function capitalizeWords(str) {
  if (!str || typeof str !== "string") return "Unknown"; // fallback
  return str
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// HELPER: Get public image URL
function getImageUrl(photoPath) {
  if (!photoPath) return "items/placeholder.jpg";

  const { data: { publicUrl } } = supabaseClient.storage
    .from("item-photos")
    .getPublicUrl(photoPath);

  return publicUrl || "items/placeholder.jpg";
}

// FETCH RECENT ITEMS
async function loadRecentItems() {
  const { data, error } = await supabaseClient
    .from("items")
    .select("*")
    .order("date_reported", { ascending: false })
    .limit(8);

  if (error) {
    console.error(error);
    grid.innerHTML = "<p>Unable to load items.</p>";
    return;
  }

  grid.innerHTML = "";

  data.forEach(item => {
    const imageUrl = getImageUrl(item.photo_url);

    const card = document.createElement("div");
    card.className = "item-card";

    card.innerHTML = `
      <div class="item-image">
        <img src="${imageUrl}" alt="${item.name || "Item image"}">
      </div>

      <h4>${item.name ? capitalizeWords(item.name) : "Unnamed Item"}</h4>

      <span class="badge ${item.status}">
        ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
      </span>
    `;

    grid.appendChild(card);
  });
}

// INIT
loadRecentItems();
