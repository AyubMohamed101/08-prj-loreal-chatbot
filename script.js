// Replace this with the URL of your deployed Cloudflare Worker.
const WORKER_URL = "https://my-api-worker.amoham97.workers.dev";

/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendButton = document.getElementById("sendBtn");
const productGrid = document.getElementById("productGrid");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutineBtn");
const productSearch = document.getElementById("productSearch");
const categoryFilter = document.getElementById("categoryFilter");
const rtlToggle = document.getElementById("rtlToggle");

// A small in-page product catalog. These fields will be sent for selected products only.
const products = [
  {
    id: "revitalift-cleanser",
    name: "Revitalift Derm Intensives Cleanser",
    brand: "L'Oreal Paris",
    category: "Skincare",
    description: "A gentle daily facial cleanser that removes dirt and makeup while helping skin feel fresh.",
  },
  {
    id: "bright-eyes",
    name: "Bright Reveal 12% Serum",
    brand: "L'Oreal Paris",
    category: "Skincare",
    description: "A brightening facial serum formulated to improve the look of uneven tone and dark spots.",
  },
  {
    id: "elvive-serum",
    name: "Elvive Hyaluron Plump Serum",
    brand: "L'Oreal Paris",
    category: "Haircare",
    description: "A lightweight hair serum that helps add hydration and a shiny, smooth finish.",
  },
  {
    id: "elseve-mask",
    name: "Ever Pure Repair Mask",
    brand: "L'Oreal Paris",
    category: "Haircare",
    description: "A nourishing hair mask made to help soften and condition damaged or color-treated hair.",
  },
  {
    id: "infallible-foundation",
    name: "Infallible Fresh Wear Foundation",
    brand: "L'Oreal Paris",
    category: "Makeup",
    description: "A breathable liquid foundation with buildable coverage and long-wearing finish.",
  },
  {
    id: "lash-paradise",
    name: "Voluminous Lash Paradise",
    brand: "L'Oreal Paris",
    category: "Makeup",
    description: "A volumizing mascara that creates full, feathery lashes with a soft, dramatic look.",
  },
  {
    id: "preference-color",
    name: "Superior Preference Hair Color",
    brand: "L'Oreal Paris",
    category: "Haircare",
    description: "An at-home permanent hair color with fade-resistant color and a glossy finish.",
  },
  {
    id: "men-expert",
    name: "Men Expert Hydra Energetic Moisturizer",
    brand: "L'Oreal Paris",
    category: "Skincare",
    description: "A daily face moisturizer designed to hydrate skin and provide a fresh, non-greasy feel.",
  },
];

// Keep the conversation so the assistant can use earlier messages.
const messages = [
  {
    role: "system",
    content:
      "You are L'Oreal's beauty assistant. Give helpful, safe, and personalized beauty advice for skincare, haircare, makeup, fragrance, and related wellness topics. Keep answers focused on the user's routine or beauty topics. Do not claim to diagnose medical conditions.",
  },
];

// Store selected products by id so cards and the selected list stay in sync.
const selectedProducts = new Map();

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

// Add one message to the chat window without treating user text as HTML.
function addMessage(role, content, citations = []) {
  const message = document.createElement("div");
  message.className = `msg ${role === "user" ? "user" : "ai"}`;
  message.textContent = `${role === "user" ? "You" : "Assistant"}: ${content}`;

  if (role === "assistant" && citations.length > 0) {
    const sourceList = document.createElement("ul");
    sourceList.className = "source-links";

    citations.forEach((citation) => {
      if (!citation.url) {
        return;
      }

      const listItem = document.createElement("li");
      const link = document.createElement("a");
      link.href = citation.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = citation.title || citation.url;
      listItem.appendChild(link);
      sourceList.appendChild(listItem);
    });

    if (sourceList.children.length > 0) {
      message.appendChild(sourceList);
    }
  }

  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Send the full conversation to the worker and return the assistant's reply.
async function requestAssistant() {
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error(`Worker request failed with status ${response.status}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error("The Worker returned an unexpected response.");
  }

  return {
    text: reply,
    citations: Array.isArray(data.citations) ? data.citations : [],
  };
}

// Create a card for every product in the catalog.
function renderProductGrid() {
  productGrid.textContent = "";

  const searchText = productSearch.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;
  const matchingProducts = products.filter((product) => {
    const matchesSearch =
      searchText === "" ||
      `${product.name} ${product.brand} ${product.category} ${product.description}`
        .toLowerCase()
        .includes(searchText);
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (matchingProducts.length === 0) {
    const noResults = document.createElement("p");
    noResults.className = "no-results";
    noResults.textContent = "No products match your search.";
    productGrid.appendChild(noResults);
    return;
  }

  matchingProducts.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.productId = product.id;
    card.tabIndex = 0;
    card.setAttribute("role", "checkbox");
    card.setAttribute("aria-checked", "false");
    card.setAttribute("aria-label", `Select ${product.name}`);

    const brand = document.createElement("p");
    brand.className = "product-brand";
    brand.textContent = product.brand;

    const name = document.createElement("h3");
    name.textContent = product.name;

    const category = document.createElement("p");
    category.className = "product-category";
    category.textContent = product.category;

    const descriptionToggle = document.createElement("button");
    descriptionToggle.type = "button";
    descriptionToggle.className = "description-toggle";
    descriptionToggle.textContent = "Show description";
    descriptionToggle.setAttribute("aria-expanded", "false");

    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = product.description;
    description.hidden = true;

    descriptionToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = !description.hidden;
      description.hidden = isOpen;
      descriptionToggle.textContent = isOpen ? "Show description" : "Hide description";
      descriptionToggle.setAttribute("aria-expanded", String(!isOpen));
    });
    descriptionToggle.addEventListener("keydown", (event) => {
      event.stopPropagation();
    });

    card.append(brand, name, category, descriptionToggle, description);
    card.addEventListener("click", () => toggleProduct(product));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleProduct(product);
      }
    });

    productGrid.appendChild(card);
  });
}

// Add or remove a product and update both visual areas.
function toggleProduct(product) {
  if (selectedProducts.has(product.id)) {
    selectedProducts.delete(product.id);
  } else {
    selectedProducts.set(product.id, product);
  }

  updateSelectedProducts();
}

// Refresh the selected card styles and the removable selected-products list.
function updateSelectedProducts() {
  document.querySelectorAll(".product-card").forEach((card) => {
    const isSelected = selectedProducts.has(card.dataset.productId);
    card.classList.toggle("selected", isSelected);
    card.setAttribute("aria-checked", String(isSelected));
  });

  selectedProductsList.textContent = "";

  if (selectedProducts.size === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-selection";
    emptyItem.textContent = "No products selected yet.";
    selectedProductsList.appendChild(emptyItem);
  } else {
    selectedProducts.forEach((product) => {
      const item = document.createElement("li");
      item.className = "selected-item";

      const itemName = document.createElement("span");
      itemName.textContent = `${product.brand} - ${product.name}`;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "remove-product";
      removeButton.textContent = "\u00D7";
      removeButton.setAttribute("aria-label", `Remove ${product.name}`);
      removeButton.addEventListener("click", () => toggleProduct(product));

      item.append(itemName, removeButton);
      selectedProductsList.appendChild(item);
    });
  }

  generateRoutineBtn.disabled = selectedProducts.size === 0;
}

/* Send a follow-up question to the Cloudflare Worker */
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const userMessage = userInput.value.trim();
  if (!userMessage) {
    return;
  }

  messages.push({ role: "user", content: userMessage });
  addMessage("user", userMessage);
  userInput.value = "";
  sendButton.disabled = true;

  try {
    const reply = await requestAssistant();
    messages.push({ role: "assistant", content: reply.text });
    addMessage("assistant", reply.text, reply.citations);
  } catch (error) {
    console.error(error);
    messages.pop();
    addMessage("assistant", "Sorry, I could not reach the chatbot. Please try again.");
  } finally {
    sendButton.disabled = false;
    userInput.focus();
  }
});

/* Generate a routine from only the selected products */
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.size === 0) {
    return;
  }

  const selectedData = Array.from(selectedProducts.values()).map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }));

  const requestText =
    "Create a simple personalized beauty routine using only this selected product JSON: " +
    JSON.stringify(selectedData) +
    ". Explain the order to use the products, group them into morning and evening when useful, and include a brief reason for each step.";

  messages.push({ role: "user", content: requestText });
  addMessage("user", "Please generate my personalized routine.");
  generateRoutineBtn.disabled = true;
  sendButton.disabled = true;

  try {
    const reply = await requestAssistant();
    messages.push({ role: "assistant", content: reply.text });
    addMessage("assistant", reply.text, reply.citations);
  } catch (error) {
    console.error(error);
    messages.pop();
    addMessage("assistant", "Sorry, I could not generate your routine. Please try again.");
  } finally {
    sendButton.disabled = false;
    generateRoutineBtn.disabled = selectedProducts.size === 0;
  }
});

productSearch.addEventListener("input", renderProductGrid);
categoryFilter.addEventListener("change", renderProductGrid);

rtlToggle.addEventListener("click", () => {
  const isRtl = document.documentElement.dir !== "rtl";
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
  document.documentElement.lang = isRtl ? "ar" : "en";
  rtlToggle.setAttribute("aria-pressed", String(isRtl));
  rtlToggle.textContent = isRtl ? "English / LTR" : "Arabic / RTL";
});

renderProductGrid();
updateSelectedProducts();
