// WAIT FOR DOM
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
  const modalTitle = document.getElementById("modalTitle");

  const itemId = document.getElementById("itemId");
  const title = document.getElementById("title");
  const category = document.getElementById("category");
  const description = document.getElementById("description");
  const status = document.getElementById("status");
  const locationInput = document.getElementById("location");
  const date_event = document.getElementById("date_event");
  const imageInput = document.getElementById("image");

  // HELPERS
  function capitalizeWords(str) {
    if (!str || typeof str !== "string") return "";
    return str
      .trim()
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

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

    await checkSession();
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

  // LOAD ITEMS
  async function loadItems() {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("date_reported", { ascending: false });

    if (error) {
      alert("Failed to load items");
      return;
    }

    allItems = (data || []).map(item => ({
      ...item,
      imageUrl: getImageUrl(item.photo_url)
    }));

    renderItems();
  }

  // RENDER TABLE
  function renderItems() {
    table.innerHTML = "";

    let items = [...allItems];

    if (currentStatus !== "all") {
      items = items.filter(i => i.status === currentStatus);
    }

    const search = searchInput.value.toLowerCase();
    items = items.filter(i =>
      (i.name ?? "").toLowerCase().includes(search)
    );

    const sortValue = sortSelect.value;

    if (sortValue === "newest") {
      items.sort((a, b) =>
        new Date(b.date_lost_found) - new Date(a.date_lost_found)
      );
    }

    if (sortValue === "oldest") {
      items.sort((a, b) =>
        new Date(a.date_lost_found) - new Date(b.date_lost_found)
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
        <td>${item.imageUrl ? `<img src="${item.imageUrl}" width="40">` : ""}</td>
        <td>${capitalizeWords(item.name)}</td>
        <td>${capitalizeWords(item.category)}</td>
        <td>${item.date_lost_found ?? ""}</td>
        <td>${capitalizeWords(item.location)}</td>
        <td><span class="badge ${item.status}">${item.status}</span></td>
        <td>
          <button class="edit-btn" data-id="${item.id}">Edit</button>
          <button class="claim-btn" data-id="${item.id}">Claimed</button>
          <button class="delete-btn" data-id="${item.id}">Delete</button>
        </td>
      `;

      table.appendChild(tr);
    });
  }

  // TABLE BUTTON CLICK HANDLER
  table.addEventListener("click", e => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains("edit-btn")) {
      openEditModal(id);
    }

    if (e.target.classList.contains("delete-btn")) {
      deleteItem(id);
    }

    if (e.target.classList.contains("claim-btn")) {
      markClaimed(id);
    }
  });

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

  // EDIT ITEM
  function openEditModal(id) {
    const item = allItems.find(i => i.id === Number(id));
    if (!item) return;

    modalTitle.innerText = "Edit Item";
    itemId.value = item.id;
    title.value = item.name ?? "";
    category.value = item.category ?? "";
    description.value = item.description ?? "";
    status.value = item.status;
    locationInput.value = item.location ?? "";
    date_event.value = item.date_lost_found
      ? item.date_lost_found.split("T")[0]
      : "";

    modal.classList.remove("hidden");
  };

  // ADD ITEM
  document.getElementById("addItemBtn").onclick = () => {
    modalTitle.innerText = "Add Item";
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

    let photo_url = null;

    if (imageInput.files.length > 0) {
      const file = imageInput.files[0];
      const filePath = `${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("item-photos")
        .upload(filePath, file);

      if (uploadError) {
        alert("Image upload failed");
        return;
      }

      photo_url = filePath;
    }

    const payload = {
      name: title.value.trim(),
      description: description.value.trim(),
      category_id: category.value.trim(),
      status: status.value,
      location: locationInput.value.trim(),
      date_lost_found: date_event.value || null,
      ...(photo_url && { photo_url })
    };

    const { error } = itemId.value
      ? await supabase.from("items").update(payload).eq("id", itemId.value)
      : await supabase.from("items").insert(payload);

    if (error) {
      alert("Error saving item: " + error.message);
      return;
    }

    modal.classList.add("hidden");
    await loadItems();
  };

  // ACTIONS
  async function deleteItem(id) { 
    if (!confirm("Delete this item?")) return;
    await supabase.from("items").delete().eq("id", id);
    await loadItems();
  };

  async function markClaimed(id) { 
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
