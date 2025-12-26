// SUPABASE SETUP
const SUPABASE_URL = "https://aynvmshmrcxcccglxcdk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bnZtc2htcmN4Y2NjZ2x4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNzEzMjgsImV4cCI6MjA4MTg0NzMyOH0.JAShR_lIGbv7MVUaiMf5qm1ufEFTXbwL6Rs4R1CYL-M";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// FETCH RECENT ITEMS
async function loadRecentItems() {
  const grid = document.getElementById("items-grid");

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
    // Generate image URL
    let imageUrl = "items/placeholder.jpg";

    if (item.photo_url) {
      const { data } = supabaseClient.storage
        .from("item-photos")
        .getPublicUrl(item.photo_url);

      imageUrl = data.publicUrl;
    }

    const card = document.createElement("div");
    card.className = "item-card";

    card.innerHTML = `
      <div class="item-image">
        <img src="${imageUrl}" alt="${item.name || "Item image"}">
      </div>

      <h4>${item.name || "Unnamed Item"}</h4>

      <span class="badge ${item.status}">
        ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
      </span>
    `;

    grid.appendChild(card);
  });
}

// INIT
loadRecentItems();
