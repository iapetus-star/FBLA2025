// LET DOM LOAD FIRST
document.addEventListener("DOMContentLoaded", () => {
  // Supabase Setup
  const supabase = window.supabase.createClient(
    "https://aynvmshmrcxcccglxcdk.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bnZtc2htcmN4Y2NjZ2x4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNzEzMjgsImV4cCI6MjA4MTg0NzMyOH0.JAShR_lIGbv7MVUaiMf5qm1ufEFTXbwL6Rs4R1CYL-M"
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

  const modal = document.getElementById("modal");
  const form = document.getElementById("itemForm");
  const itemId = document.getElementById("itemId");
  const title = document.getElementById("title");
  const category = document.getElementById("category");
  const description = document.getElementById("description");
  const status = document.getElementById("status");
  const locationInput = document.getElementById("location"); // avoid conflict with window.location
  const date_event = document.getElementById("date_event");
  const visible = document.getElementById("visible");

  // LOGIN 
  loginForm.onsubmit = async e => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
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

// ADMIN ACCESS
async function checkAdminAccess() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    alert("Please log in.");
    return checkSession();
  }

  // User is admin
  loginModal.classList.add("hidden");
  adminContent.classList.remove("hidden");
  await loadItems();
}

  // LOAD ITEMS
  async function loadItems() {
    const { data } = await supabase
      .from("items")
      .select("*")
      .order("date_reported", { ascending: false });
    allItems = data || [];
    renderItems();
  }

  // RENDER ITEMS
  function renderItems() {
    table.innerHTML = "";
    let items = [...allItems];

    if (currentStatus !== "all") items = items.filter(i => i.status === currentStatus);

    const search = searchInput.value.toLowerCase();
    items = items.filter(i => i.title.toLowerCase().includes(search));

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

  // FILTER TABS
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
    title.value = item.title;
    category.value = item.category;
    description.value = item.description;
    status.value = item.status;
    locationInput.value = item.location;
    date_event.value = item.date_event;
    visible.checked = item.visible;
    modal.classList.remove("hidden");
  };

  document.getElementById("addItemBtn").onclick = () => {
    form.reset();
    itemId.value = "";
    modal.classList.remove("hidden");
  };

  document.getElementById("cancelBtn").onclick = () => modal.classList.add("hidden");

  // SAVE ITEM
  form.onsubmit = async e => {
    e.preventDefault();
    const payload = {
      title: title.value,
      category: category.value,
      description: description.value,
      status: status.value,
      location: locationInput.value,
      date_event: date_event.value,
      visible: visible.checked
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
  window.deleteItem = async function(id) {
    if (!confirm("Delete this item?")) return;
    await supabase.from("items").delete().eq("id", id);
    await loadItems();
  };

  window.markClaimed = async function(id) {
    await supabase.from("items").update({ status: "claimed", visible: false }).eq("id", id);
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
