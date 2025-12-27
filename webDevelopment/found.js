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

//HELPER: Capitalizes the first letter of each word
function capitalizeWords(str) {
  if (!str || typeof str !== "string") return "Unknown"; // fallback
  return str
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// HELPER: get public image URL
function getImageUrl(photoPath) {
  if (!photoPath) return "";

  const { data } = supabaseClient.storage
    .from("item-photos")
    .getPublicUrl(photoPath);

  return data.publicUrl;
}

// FETCH FOUND ITEMS
async function fetchFoundItems() {
  const { data, error } = await supabaseClient
    .from("items")

    .select(`
      *,
      categories(
        name
      )`)    
    .eq("status", "found")
    .order("date_reported", { ascending: false });

  if (error) {
    console.error("Error fetching found items:", error);
    return;
  }

  // attach image URLs and save category name
  allItems = data.map(item => ({
    ...item,
    imageUrl: getImageUrl(item.photo_url),
    categoryName: item.category && item.category.length > 0
      ? item.category[0].name
      : "Unknown"  
  }));

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
        background-image: url('${item.imageUrl || ""}');
      "></div>

      <h4>${item.name ? capitalizeWords(item.name) : "Unnamed Item"}</h4>
      <span class="badge found">Found</span>

      <div class="item-location">
        📍   ${item.location ? capitalizeWords(item.location) : "Unknown location"}
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
  const category = categoryFilter.value.toLowerCase();
  const location = locationFilter.value.toLowerCase();

  const filtered = allItems.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(search) ||
      (item.description || "").toLowerCase().includes(search);

    const matchesCategory =
      !category || item.categoryName.toLowerCase() === category; 

    const matchesLocation =
      !location || item.location?.toLowerCase() === location;

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
