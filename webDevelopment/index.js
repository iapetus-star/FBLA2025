// SUPABASE SETUP
// SUPABASE PROJECT URL HERE
const SUPABASE_URL = "https://aynvmshmrcxcccglxcdk.supabase.co";

// SUPABASE ANON KEY HERE
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bnZtc2htcmN4Y2NjZ2x4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNzEzMjgsImV4cCI6MjA4MTg0NzMyOH0.JAShR_lIGbv7MVUaiMf5qm1ufEFTXbwL6Rs4R1CYL-M";

// CREATE SUPABASE CLIENT
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
    const card = document.createElement("div");
    card.className = "item-card";

    card.innerHTML = `
      <div class="item-image"></div>
      <h4>${item.name || "Unnamed Item"}</h4>
      <span class="badge ${item.status === "lost" ? "lost" : "found"}">
        ${item.status === "lost" ? "Lost" : "Found"}
      </span>
    `;

    grid.appendChild(card);
  });
}

// INIT
loadRecentItems();
