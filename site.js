const cartStorageKey = "cyberRigsCart";
let inMemoryCart = {};

const productGrid = document.querySelector(".product-grid[data-pagination]");
if (productGrid) {
  const existingProducts = [...productGrid.querySelectorAll("[data-product-card]")];
  const sampleProducts = existingProducts.slice(0, 3);

  existingProducts.slice(3).forEach((product, index) => {
    const image = sampleProducts[index % sampleProducts.length].querySelector(".img-box img").cloneNode();
    image.alt = `Gaming PC ${String(index + 4).padStart(2, "0")} - sample image`;
    product.querySelector(".img-box").replaceChildren(image);
  });

  for (let productNumber = existingProducts.length + 1; productNumber <= 36; productNumber += 1) {
    const sampleIndex = (productNumber - existingProducts.length - 1) % sampleProducts.length;
    const product = sampleProducts[sampleIndex].cloneNode(true);
    const productName = `Gaming PC ${String(productNumber).padStart(2, "0")}`;
    const image = product.querySelector(".img-box img");
    const addButton = product.querySelector("[data-add-to-cart]");

    product.querySelector(".card-tag").textContent = "GAMING";
    image.alt = `${productName} - sample image`;
    product.querySelector(".card-info h3").textContent = productName;
    product.querySelector(".specs").textContent =
      "CPU: Add processor | GPU: Add graphics card | RAM: Add memory";
    product.querySelector(".price").textContent = "Add price";
    addButton.dataset.addToCart = productName;
    addButton.removeAttribute("data-price");
    productGrid.append(product);
  }
}

function readCart() {
  try {
    const savedCart = localStorage.getItem(cartStorageKey);
    const parsedCart = savedCart ? JSON.parse(savedCart) : {};
    inMemoryCart = parsedCart && typeof parsedCart === "object" && !Array.isArray(parsedCart)
      ? parsedCart
      : {};
  } catch (error) {
    console.error("Unable to read the cart from browser storage.", error);
  }
  return inMemoryCart;
}

function saveCart(cart) {
  inMemoryCart = cart;
  try {
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  } catch (error) {
    console.error("Unable to save the cart to browser storage.", error);
  }
}

function updateCartCount() {
  const cart = readCart();
  const count = Object.values(cart).reduce((total, item) => total + item.quantity, 0);

  document.querySelectorAll(".cart-button").forEach((button) => {
    button.textContent = `CART [${count}]`;
    button.setAttribute("aria-label", `Open cart with ${count} items`);
  });
}

const cartDialog = document.querySelector("#cart-dialog");
const cartItemsList = document.querySelector("#cart-items");
const cartTotal = document.querySelector("#cart-total");

document.querySelector("#close-cart")?.addEventListener("click", () => {
  cartDialog?.close();
});

document.querySelector("#continue-shopping")?.addEventListener("click", () => {
  cartDialog?.close();
});

cartDialog?.addEventListener("click", (event) => {
  if (event.target === cartDialog) cartDialog.close();
});

function renderCart() {
  if (!cartDialog || !cartItemsList || !cartTotal) return;

  const cart = readCart();
  const items = Object.values(cart).filter((item) => item.quantity > 0);
  cartItemsList.replaceChildren();

  if (items.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "cart-empty";
    emptyMessage.textContent = "កន្ត្រករបស់អ្នកនៅទទេ។";
    cartItemsList.append(emptyMessage);
  }

  let total = 0;
  let hasUnpricedItems = false;
  items.forEach((item) => {
    const row = document.createElement("li");
    row.className = "cart-item";
    const details = document.createElement("div");
    const name = document.createElement("strong");
    const quantity = document.createElement("span");
    const price = document.createElement("span");

    name.textContent = item.name;
    quantity.textContent = `ចំនួន: ${item.quantity}`;
    if (Number.isFinite(item.price) && item.price >= 0) {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      price.textContent = `$${itemTotal.toLocaleString("en-US")}`;
    } else {
      hasUnpricedItems = true;
      price.textContent = "តម្លៃមិនទាន់កំណត់";
    }

    details.append(name, quantity);
    row.append(details, price);
    cartItemsList.append(row);
  });

  cartTotal.textContent = `$${total.toLocaleString("en-US")}${hasUnpricedItems ? " + តម្លៃមិនទាន់កំណត់" : ""}`;
}

document.querySelectorAll(".cart-button").forEach((button) => {
  button.addEventListener("click", () => {
    renderCart();
    cartDialog?.showModal();
  });
});

document.querySelector("#reset-cart")?.addEventListener("click", () => {
  saveCart({});
  updateCartCount();
  renderCart();
});

document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
  button.addEventListener("click", () => {
    const cart = readCart();
    const name = button.dataset.addToCart;
    const priceValue = Number(button.dataset.price);
    const price = button.dataset.price !== undefined && Number.isFinite(priceValue) && priceValue >= 0
      ? priceValue
      : null;
    const previousItem = cart[name];
    cart[name] = {
      name,
      quantity: previousItem ? previousItem.quantity + 1 : 1,
      price: price ?? previousItem?.price ?? null,
    };
    saveCart(cart);
    updateCartCount();
    renderCart();

    const originalText = button.textContent;
    button.textContent = "ADDED!";
    window.setTimeout(() => {
      button.textContent = originalText;
    }, 1200);
  });
});

updateCartCount();

const pagination = document.querySelector(".pagination");
const productsPerPage = productGrid
  ? Number.parseInt(productGrid.dataset.pageSize, 10) || 3
  : 3;
let currentPage = 1;
let activeSearchQuery = "";

function renderProducts() {
  if (!productGrid || !pagination) return;

  const products = [...productGrid.querySelectorAll("[data-product-card]")];
  const matchingProducts = products.filter((product) =>
    product.textContent.toLocaleLowerCase().includes(activeSearchQuery)
  );
  const totalPages = Math.max(1, Math.ceil(matchingProducts.length / productsPerPage));
  currentPage = Math.min(currentPage, totalPages);

  const firstProductIndex = (currentPage - 1) * productsPerPage;
  const visibleProducts = new Set(
    matchingProducts.slice(firstProductIndex, firstProductIndex + productsPerPage)
  );
  products.forEach((product) => {
    product.hidden = !visibleProducts.has(product);
  });

  const message = document.querySelector("#search-message");
  if (message) {
    message.textContent = matchingProducts.length === 0
      ? "រកមិនឃើញផលិតផលដែលត្រូវនឹងការស្វែងរកទេ។"
      : activeSearchQuery
        ? `រកឃើញផលិតផល ${matchingProducts.length} មុខ។`
        : "";
  }

  const pageWindowSize = 4;
  const firstPageNumber = Math.max(
    1,
    Math.min(currentPage - 1, totalPages - pageWindowSize + 1)
  );
  const pageNumbers = Array.from(
    { length: Math.min(pageWindowSize, totalPages) },
    (_, index) => firstPageNumber + index
  );
  pagination.replaceChildren();

  if (firstPageNumber > 1) {
    pagination.append(createPageButton("Previous", currentPage - 1));
  }

  pageNumbers.forEach((pageNumber) => {
    const button = createPageButton(String(pageNumber), pageNumber);
    if (pageNumber === currentPage) {
      button.setAttribute("aria-current", "page");
    }
    pagination.append(button);
  });

  pagination.append(createPageButton("Next", currentPage + 1, currentPage === totalPages));
}

function createPageButton(label, pageNumber, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.page = String(pageNumber);
  button.disabled = disabled || pageNumber < 1;
  button.setAttribute("aria-label", label === "Next" || label === "Previous"
    ? label
    : `Page ${pageNumber}`);
  button.addEventListener("click", () => {
    if (button.disabled) return;
    currentPage = Number(button.dataset.page);
    renderProducts();
    document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });
  });
  return button;
}

if (pagination) {
  renderProducts();
}

document.querySelectorAll(".search-box").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = form.querySelector("input").value.trim();
    const products = [...document.querySelectorAll("[data-product-card]")];

    if (!productGrid || products.length === 0) {
      window.location.href = `products.html?q=${encodeURIComponent(query)}`;
      return;
    }

    activeSearchQuery = query.toLocaleLowerCase();
    currentPage = 1;
    renderProducts();
    document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });
  });
});

const initialQuery = new URLSearchParams(window.location.search).get("q");
if (initialQuery) {
  const searchInput = document.querySelector(".search-box input");
  if (searchInput) {
    searchInput.value = initialQuery;
    searchInput.closest("form").requestSubmit();
  }
}

document.querySelectorAll("[data-booking-form], [data-contact-form]").forEach((form) => {
  form.addEventListener("invalid", (event) => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) {
      return;
    }

    if (field.validity.valueMissing) {
      field.setCustomValidity("សូមបំពេញព័ត៌មាននេះ ហើយពិនិត្យកែប្រែម្ដងទៀត។");
    } else if (field.validity.typeMismatch) {
      field.setCustomValidity("សូមពិនិត្យ និងកែប្រែទម្រង់ព័ត៌មាននេះម្ដងទៀត។");
    }
  }, true);

  form.addEventListener("input", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      event.target.setCustomValidity("");
    }
  });

  form.addEventListener("change", (event) => {
    if (event.target instanceof HTMLSelectElement) {
      event.target.setCustomValidity("");
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = form.querySelector(".form-message");
    if (!message) return;

    message.textContent = form.matches("[data-booking-form]")
      ? "ព័ត៌មានកក់ត្រូវបានទទួលក្នុងការសាកល្បងនេះ។"
      : "សាររបស់អ្នកត្រូវបានទទួលក្នុងការសាកល្បងនេះ។";
    form.reset();
  });
});
