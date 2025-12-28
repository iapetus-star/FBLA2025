// LET DOM LOAD FIRST
document.addEventListener("DOMContentLoaded", () => {
  // SUPABASE SETUP
  const supabase = window.supabase.createClient(
    "https://aynvmshmrcxcccglxcdk.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bnZtc2htcmN4Y2NjZ2x4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNzEzMjgsImV4cCI6MjA4MTg0NzMyOH0.JAShR_lIGbv7MVUaiMf5qm1ufEFTXbwL6Rs4R1CYL-M",
    {
      auth: {
        persistSession: false
      }
    }
  );

// STATE
  let allItems = [];
  let currentStatus = "all";

// ELEMENTS
  const loginModal = document.getElementById("loginModal");
  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const adminContent = document.getElementById("adminContent");
  const table = document.getElementById("itemsTable");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");

  const modal = document.getElementById("modal");
  const form = document.getElementById("itemForm");
  const itemId = document.getElementById("itemId");
  const title = document.getElementById("title");
  const category = document.getElementById("category");
  const description = document.getElementById("description");
  const status = document.getElementById("status");
  const locationInput = document.getElementById("location");
  const date_event = document.getElementById("date_event");

// HELPER FUNCTIONS
  // Capitalize words
function capitalizeWords(str) {
  if (!str || typeof str !== "string") return "Unknown";
  return str
    .trim()
     .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

  // Get public image URL
  function getImageUrl(photoPath) {
    if (!photoPath) return "";
    const { data } = supabase.storage
      .from("item-photos")
      .getPublicUrl(photoPath);
    return data.publicUrl;
  }

  // LOGIN
  loginForm.onsubmit = async e => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.value,
      password: loginPassword.value
    });

    if (error) {
      alert("Login failed: " + error.message);
      return;
    }

    await checkAdminAccess();
  };

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      loginModal.classList.add("hidden");
      adminContent.classList.remove("hidden");
      await loadItems();
    } else {
      loginModal.classList.remove("hidden");
      adminContent.classList.add("hidden");
    }
    document.body.style.display = "block";
  }

  async function checkAdminAccess() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return checkSession();

    loginModal.classList.add("hidden");
    adminContent.classList.remove("hidden");
    await loadItems();
  }

  // LOAD ITEMS
  async function loadItems() {
    const { data } = await supabase
      .from("items")
      .select(`
        *,
        categories(name)
      `)
      .order("date_reported", { ascending: false });

    allItems = (data || []).map(item => ({
      ...item,
      imageUrl: getImageUrl(item.photo_url),
      categoryName: item.categories?.name
        ? item.categories.name.trim().toLowerCase()
        : "unknown"
    }));

    renderItems();
  }

  // RENDER ITEMS
  function renderItems() {
    table.innerHTML = "";

    let items = [...allItems];

    // Status filter
    if (currentStatus !== "all") {
      items = items.filter(i => i.status === currentStatus);
    }

    // Search filter
    const search = searchInput.value.toLowerCase();
    items = items.filter(i =>
      (i.name ?? "").toLowerCase().includes(search)
    );

// SORTING (newest, oldest, A–Z)
const sortValue = sortSelect.value;

if (sortValue === "newest") {
  items.sort(
    (a, b) => new Date(b.date_lost_found) - new Date(a.date_lost_found)
  );
}

if (sortValue === "oldest") {
  items.sort(
    (a, b) => new Date(a.date_lost_found) - new Date(b.date_lost_found)
  );
}

if (sortValue === "az") {
  items.sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "")
  );
}

    items.forEach(item => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>
          ${item.imageUrl ? `<img src="${item.imageUrl}" width="40" />` : ""}
        </td>
        <td>${capitalizeWords(item.name)}</td>
        <td>${capitalizeWords(item.categoryName)}</td>
        <td>${item.date_lost_found ?? ""}</td>
        <td>${capitalizeWords(item.location ?? "")}</td>
        <td>
          <span class="badge ${item.status}">
            ${item.status}
          </span>
        </td>
        <td>
          <button onclick="editItem('${item.id}')">Edit</button>
          <button onclick="markClaimed('${item.id}')">Claimed</button>
          <button onclick="deleteItem('${item.id}')">Delete</button>
        </td>
      `;

      table.appendChild(tr);
    });
  }

  // FILTER EVENTS
  searchInput.addEventListener("input", renderItems);
  sortSelect.addEventListener("change", renderItems);

  document.querySelectorAll(".tabs button").forEach(btn => {
    btn.onclick = () => {
      document.querySelector(".tabs .active").classList.remove("active");
      btn.classList.add("active");
      currentStatus = btn.dataset.status;
      renderItems();
    };
  });

  // MODAL LOGIC
  window.editItem = function(id) {
    const item = allItems.find(i => i.id === id);
    if (!item) return;

    itemId.value = item.id;
    title.value = item.name;
    category.value = item.category_id ?? "";
    description.value = item.description ?? "";
    status.value = item.status;
    locationInput.value = item.location ?? "";
    date_event.value = item.date_lost_found
      ? item.date_lost_found.split("T")[0]
      : "";

    modal.classList.remove("hidden");
  };

  document.getElementById("addItemBtn").onclick = () => {
    form.reset();
    itemId.value = "";
    modal.classList.remove("hidden");
  };

  document.getElementById("cancelBtn").onclick = () => {
    modal.classList.add("hidden");
  };

  // SAVE ITEM
  form.onsubmit = async e => {
    e.preventDefault();

    const payload = {
      name: title.value.trim(),
      description: description.value.trim(),
      category_id: category.value || null,
      status: status.value,
      location: locationInput.value.trim(),
      date_lost_found: date_event.value || null
    };

    if (itemId.value) {
      await supabase.from("items").update(payload).eq("id", itemId.value);
    } else {
      await supabase.from("items").insert(payload);
    }

    modal.classList.add("hidden");
    await loadItems();
  };

  // ACTIONS
  window.deleteItem = async id => {
    if (!confirm("Delete this item?")) return;
    await supabase.from("items").delete().eq("id", id);
    await loadItems();
  };

  window.markClaimed = async id => {
    await supabase
      .from("items")
      .update({ status: "claimed", claimed_by: "admin" })
      .eq("id", id);
    await loadItems();
  };

  // LOGOUT
  document.getElementById("logoutBtn").onclick = async () => {
    await supabase.auth.signOut();
    checkSession();
  };

  // INIT
  checkSession();
});
