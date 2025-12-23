// SUPABASE SETUP
const SUPABASE_URL = "https://aynvmshmrcxcccglxcdk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bnZtc2htcmN4Y2NjZ2x4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNzEzMjgsImV4cCI6MjA4MTg0NzMyOH0.JAShR_lIGbv7MVUaiMf5qm1ufEFTXbwL6Rs4R1CYL-M";


const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// DOM ELEMENTS
const itemsGrid = document.getElementById("itemsGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const locationFilter = document.getElementById("locationFilter");

// STATE
let allItems = [];

// FETCH FOUND ITEMS
async function fetchFoundItems() {
  const { data, error } = await supabaseClient
    .from("items")
    .select("*")
    .eq("status", "found")
    .order("date_reported", { ascending: false });

  if (error) {
    console.error("Error fetching found items:", error);
    return;
  }

  allItems = data;
  renderItems(allItems);
}

// RENDER ITEMS
function renderItems(items) {
  itemsGrid.innerHTML = "";

  if (items.length === 0) {
    itemsGrid.innerHTML = "<p>No found items currently listed.</p>";
    return;
  }

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";

    card.innerHTML = `
      <div class="item-image" style="
        background-image: url('${item.image_url || ""}');
        background-size: cover;
        background-position: center;
      "></div>
      <h4>${item.name}</h4>
      <span class="badge found">Found</span>
      <div class="item-location">
        📍 ${item.location || "Main Office"}
      </div>
    `;

    card.addEventListener("click", () => {
      window.location.href = `item.html?id=${item.id}`;
    });

    itemsGrid.appendChild(card);
  });
}

// FILTER LOGIC
function applyFilters() {
  const search = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const location = locationFilter.value;

  const filtered = allItems.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(search) ||
      (item.description || "").toLowerCase().includes(search);

    const matchesCategory =
      !category || item.category === category;

    const matchesLocation =
      !location || item.location === location;

    return matchesSearch && matchesCategory && matchesLocation;
  });

  renderItems(filtered);
}

// EVENT LISTENERS
searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
locationFilter.addEventListener("change", applyFilters);

// INIT
fetchFoundItems();
