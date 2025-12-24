// Supabase Setup
const supabase = window.supabase.createClient(
  "https://aynvmshmrcxcccglxcdk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bnZtc2htcmN4Y2NjZ2x4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNzEzMjgsImV4cCI6MjA4MTg0NzMyOH0.JAShR_lIGbv7MVUaiMf5qm1ufEFTXbwL6Rs4R1CYL-M"
);

// State
let allItems = [];
let currentStatus = "all";

// Admin Gate
async function checkAdminAccess() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    alert("Please log in");
    location.href = "/";
    return;
  }

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email", user.email)
    .single();

  if (!data) {
    alert("Access denied");
    await supabase.auth.signOut();
    location.href = "/";
  }
}

// Load Items
async function loadItems() {
  const { data } = await supabase
    .from("items")
    .select("*")
    .order("date_reported", { ascending: false });

  allItems = data || [];
  renderItems();
}

// Render
function renderItems() {
  const table = document.getElementById("itemsTable");
  table.innerHTML = "";

  let items = [...allItems];

  if (currentStatus !== "all") {
    items = items.filter(i => i.status === currentStatus);
  }

  const search = document.getElementById("searchInput").value.toLowerCase();
  items = items.filter(i =>
    i.title.toLowerCase().includes(search)
  );

  items.forEach(item => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.image_url ? `<img src="${item.image_url}" width="40" />` : ""}</td>
      <td>${item.title}</td>
      <td>${item.category || ""}</td>
      <td>${item.date_event || ""}</td>
      <td>${item.location || ""}</td>
      <td><span class="badge ${item.status}">${item.status}</span></td>
      <td>
        <button onclick="editItem('${item.id}')">Edit</button>
        <button onclick="markClaimed('${item.id}')">Claimed</button>
        <button onclick="deleteItem('${item.id}')">Delete</button>
      </td>
    `;
    table.appendChild(tr);
  });
}

// Tabs
document.querySelectorAll(".tabs button").forEach(btn => {
  btn.onclick = () => {
    document.querySelector(".tabs .active").classList.remove("active");
    btn.classList.add("active");
    currentStatus = btn.dataset.status;
    renderItems();
  };
});

// Modal Logic
const modal = document.getElementById("modal");
const form = document.getElementById("itemForm");

function editItem(id) {
  const item = allItems.find(i => i.id === id);
  itemId.value = item.id;
  title.value = item.title;
  category.value = item.category;
  description.value = item.description;
  status.value = item.status;
  location.value = item.location;
  date_event.value = item.date_event;
  visible.checked = item.visible;
  modal.classList.remove("hidden");
}

document.getElementById("addItemBtn").onclick = () => {
  form.reset();
  itemId.value = "";
  modal.classList.remove("hidden");
};

document.getElementById("cancelBtn").onclick = () => {
  modal.classList.add("hidden");
};

// Save Item
form.onsubmit = async e => {
  e.preventDefault();

  const payload = {
    title: title.value,
    category: category.value,
    description: description.value,
    status: status.value,
    location: location.value,
    date_event: date_event.value,
    visible: visible.checked
  };

  if (itemId.value) {
    await supabase.from("items").update(payload).eq("id", itemId.value);
  } else {
    await supabase.from("items").insert(payload);
  }

  modal.classList.add("hidden");
  loadItems();
};

// Actions
async function deleteItem(id) {
  if (!confirm("Delete this item?")) return;
  await supabase.from("items").delete().eq("id", id);
  loadItems();
}

async function markClaimed(id) {
  await supabase.from("items")
    .update({ status: "claimed", visible: false })
    .eq("id", id);
  loadItems();
}

// Logout
document.getElementById("logoutBtn").onclick = async () => {
  await supabase.auth.signOut();
  location.href = "/";
};

// Init
(async () => {
  await checkAdminAccess();
  await loadItems();
})();
