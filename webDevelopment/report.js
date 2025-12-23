// SUPABASE SETUP
const SUPABASE_URL = "https://aynvmshmrcxcccglxcdk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bnZtc2htcmN4Y2NjZ2x4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNzEzMjgsImV4cCI6MjA4MTg0NzMyOH0.JAShR_lIGbv7MVUaiMf5qm1ufEFTXbwL6Rs4R1CYL-M";

const supabaseClient = supabase.createClient(
SUPABASE_URL,
SUPABASE_ANON_KEY
);

// DOM ELEMENTS
const reportForm = document.getElementById("reportForm");
const formMessage = document.getElementById("formMessage");
const reportTypeSelect = document.getElementById("reportType");
const pageHeader = document.querySelector(".page-header h2");

// MAX IMAGE SIZE (5MB)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// DYNAMIC HEADER BASED ON TYPE
reportTypeSelect.addEventListener("change", (e) => {
  pageHeader.textContent = e.target.value === "lost" ? "Report Lost Item" : "Report Found Item";
});

// SUBMIT FORM
reportForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "Submitting...";

  const reportType = reportTypeSelect.value; // "lost" or "found"
  const name = document.getElementById("name").value.trim();
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value.trim() || null;
  const date = document.getElementById("date").value || null;
  const location = document.getElementById("location").value.trim() || null;
  const photoFile = document.getElementById("photo").files[0];

  let imageUrl = null;

  // IMAGE UPLOAD
  if (photoFile) {
    if (!photoFile.type.startsWith("image/")) {
      formMessage.textContent = "File must be an image!";
      return;
    }

    if (photoFile.size > MAX_IMAGE_SIZE) {
      formMessage.textContent = "Image is too large (max 5MB)!";
      return;
    }

    const fileName = `${Date.now()}_${photoFile.name}`;

    const { data, error: uploadError } = await supabaseClient.storage
      .from("item-photos")
      .upload(`public/${fileName}`, photoFile);

    if (uploadError) {
      formMessage.textContent = "Photo upload failed!";
      console.error(uploadError);
      return;
    }

    // Get public URL automatically from Supabase
    const { publicUrl, error: urlError } = supabaseClient.storage
      .from("item-photos")
      .getPublicUrl(`public/${fileName}`);

    if (urlError) {
      formMessage.textContent = "Failed to get image URL!";
      console.error(urlError);
      return;
    }

    imageUrl = publicUrl;
  }

  // INSERT INTO DATABASE
  const { error } = await supabaseClient.from("items").insert([{
    type: reportType,
    name,
    category,
    description,
    date,
    location,
    image_url: imageUrl,
    status: "pending"
  }]);

  if (error) {
    formMessage.textContent = "Error submitting item!";
    console.error(error);
  } else {
    formMessage.textContent = `Item submitted as ${reportType}! Waiting for admin approval.`;
    reportForm.reset();
    // Reset header back to Lost after submit
    pageHeader.textContent = "Report Lost Item";
  }
});
