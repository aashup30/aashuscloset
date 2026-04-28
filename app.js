const STORAGE_KEY = "mycloset.state.v1";
const AUTH_KEY = "aashuscloset.role";
const AUTH_EXPIRES_KEY = "aashuscloset.role.expires";
const CLOUD_STATE_ID = "main";
const PHOTO_BUCKET = "closet-photos";
const LOCAL_MASTER_PASSWORD = "aashnichirakpatelpapa";

const baseCategories = ["Tops", "Bottoms", "Outerwear", "Accessories", "Cultural Wear", "Shoes"];
const baseTypes = ["Bag", "Blouse", "Button-up", "Dupatta", "Jacket", "Jeans", "Lehenga", "Shirt", "Shoes", "Sweater", "T-shirt", "Trouser"];
const baseLocations = ["Home", "Mom's House", "Lake House", "Storage", "Austria"];
const colorOptions = [
  ["Black", "#242424"],
  ["White", "#f5f2e8"],
  ["Cream", "#e7ddc6"],
  ["Gray", "#8c908a"],
  ["Brown", "#9a6a42"],
  ["Gold", "#c7a553"],
  ["Green", "#14705b"],
  ["Forest", "#314f45"],
  ["Blue", "#4f6c8a"],
  ["Red", "#a7453d"],
  ["Pink", "#c98b9c"],
  ["Purple", "#7b659b"],
];

const sampleItems = [
  item("linen-shirt", "White linen button-up", "Uniqlo", "Tops", "Button-up", "Linen", ["#f5f2e8"], "Home", [
    "button up",
    "summer",
    "work",
  ]),
  item("patagonia-jacket", "Forest rain shell", "Patagonia", "Outerwear", "Jacket", "Nylon", ["#314f45"], "Austria", [
    "outdoor",
    "travel",
    "rain",
  ]),
  item("black-trouser", "Black tailored trouser", "Everlane", "Bottoms", "Trouser", "Wool blend", ["#242424"], "Home", [
    "work",
    "formal",
    "black",
  ]),
  item("denim-jeans", "Straight denim jean", "Levi's", "Bottoms", "Jeans", "Denim", ["#4f6c8a"], "Storage", [
    "casual",
    "denim",
    "weekend",
  ]),
  item("silk-lehenga", "Emerald silk lehenga", "Fabindia", "Cultural Wear", "Lehenga", "Silk", ["#14705b"], "Home", [
    "wedding",
    "indian",
    "festive",
  ]),
  item("gold-dupatta", "Gold embroidered dupatta", "Local artisan", "Cultural Wear", "Dupatta", "Chiffon", ["#c7a553"], "Mom's House", [
    "wedding",
    "indian",
    "festive",
  ]),
  item("cream-blouse", "Cream mirrorwork blouse", "Aza", "Cultural Wear", "Blouse", "Cotton silk", ["#e7ddc6"], "Mom's House", [
    "wedding",
    "indian",
    "top",
  ]),
  item("brown-bag", "Cognac crossbody bag", "Madewell", "Accessories", "Bag", "Leather", ["#9a6a42"], "Home", [
    "travel",
    "casual",
    "purse",
  ]),
  item("knit-sweater", "Oat ribbed sweater", "COS", "Tops", "Sweater", "Merino", ["#c9bda9"], "Lake House", [
    "winter",
    "sweater",
    "cozy",
  ]),
];

const defaultState = {
  items: sampleItems,
  outfits: [
    {
      id: "office-look",
      name: "Office look",
      occasion: "Work",
      tags: ["work", "minimal"],
      notes: "Reliable office combination.",
      itemIds: ["linen-shirt", "black-trouser", "brown-bag"],
    },
    {
      id: "emerald-wedding-outfit",
      name: "Emerald wedding outfit",
      occasion: "Wedding",
      tags: ["indian", "festive"],
      notes: "Linked lehenga, blouse, and dupatta.",
      itemIds: ["silk-lehenga", "cream-blouse", "gold-dupatta"],
    },
  ],
  boards: [
    {
      id: "office-capsule",
      name: "Office capsule",
      notes: "Simple work board",
      itemIds: ["linen-shirt", "black-trouser", "brown-bag"],
    },
    {
      id: "emerald-wedding",
      name: "Emerald wedding set",
      notes: "Multi-piece cultural wear",
      itemIds: ["silk-lehenga", "cream-blouse", "gold-dupatta"],
    },
  ],
  activeTag: "",
  selectedLocation: "",
  hiddenOptions: {
    category: [],
    type: [],
    location: [],
  },
};

let state = normalizeState(loadState());
let activeOutfitPickerId = "";
let activeBoardPickerId = "";
let activeBoardDetailId = "";
let currentRole = "";
let currentUser = null;
let cloudSaveTimer = null;
let quickMasterClicks = 0;
let quickMasterClickTimer = null;
let selectedPhotoFiles = [];
let draggedPhotoIndex = null;
let itemDetailImageIndexes = {};
let editPhotoDraftsByItem = {};
let draggedEditPhoto = null;
const supabaseConfig = window.AASHUS_CLOSET_SUPABASE;
const supabaseClient =
  window.supabase && supabaseConfig?.url && supabaseConfig?.publishableKey
    ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.publishableKey)
    : null;

const els = {
  authScreen: document.querySelector("#authScreen"),
  authForm: document.querySelector("#authForm"),
  quickMasterButton: document.querySelector("#quickMasterButton"),
  emailInput: document.querySelector("#emailInput"),
  passwordInput: document.querySelector("#passwordInput"),
  authError: document.querySelector("#authError"),
  appShell: document.querySelector("#appShell"),
  rolePill: document.querySelector("#rolePill"),
  logoutButton: document.querySelector("#logoutButton"),
  navTabs: document.querySelectorAll(".nav-tab"),
  views: {
    closet: document.querySelector("#closetView"),
    outfits: document.querySelector("#outfitsView"),
    locations: document.querySelector("#locationsView"),
    boards: document.querySelector("#boardsView"),
  },
  viewTitle: document.querySelector("#viewTitle"),
  addItemButton: document.querySelector("#addItemButton"),
  itemDialog: document.querySelector("#itemDialog"),
  itemDetailDialog: document.querySelector("#itemDetailDialog"),
  itemDetailContent: document.querySelector("#itemDetailContent"),
  outfitDetailDialog: document.querySelector("#outfitDetailDialog"),
  outfitDetailContent: document.querySelector("#outfitDetailContent"),
  outfitPieceDialog: document.querySelector("#outfitPieceDialog"),
  outfitPieceForm: document.querySelector("#outfitPieceForm"),
  closeOutfitPieceDialog: document.querySelector("#closeOutfitPieceDialog"),
  outfitPieceTitle: document.querySelector("#outfitPieceTitle"),
  outfitPieceSearch: document.querySelector("#outfitPieceSearch"),
  outfitPieceCategory: document.querySelector("#outfitPieceCategory"),
  outfitPieceLocation: document.querySelector("#outfitPieceLocation"),
  outfitPieceTag: document.querySelector("#outfitPieceTag"),
  outfitPieceGrid: document.querySelector("#outfitPieceGrid"),
  boardPickerDialog: document.querySelector("#boardPickerDialog"),
  boardPickerForm: document.querySelector("#boardPickerForm"),
  closeBoardPickerDialog: document.querySelector("#closeBoardPickerDialog"),
  boardPickerTitle: document.querySelector("#boardPickerTitle"),
  boardPickerSearch: document.querySelector("#boardPickerSearch"),
  boardPickerGrid: document.querySelector("#boardPickerGrid"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  itemForm: document.querySelector("#itemForm"),
  itemFormError: document.querySelector("#itemFormError"),
  itemPhotoInput: document.querySelector("#itemPhotoInput"),
  itemPhotoPreviewWrap: document.querySelector("#itemPhotoPreviewWrap"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  locationFilter: document.querySelector("#locationFilter"),
  tagFilter: document.querySelector("#tagFilter"),
  closetGrid: document.querySelector("#closetGrid"),
  outfitItemSearch: document.querySelector("#outfitItemSearch"),
  locationStats: document.querySelector("#locationStats"),
  totalItems: document.querySelector("#totalItems"),
  totalLocations: document.querySelector("#totalLocations"),
  locationButtons: document.querySelector("#locationButtons"),
  locationBoard: document.querySelector("#locationBoard"),
  outfitForm: document.querySelector("#outfitForm"),
  outfitPicker: document.querySelector("#outfitPicker"),
  outfitGrid: document.querySelector("#outfitGrid"),
  boardForm: document.querySelector("#boardForm"),
  boardGrid: document.querySelector("#boardGrid"),
  boardDetailView: document.querySelector("#boardDetailView"),
  itemCategoryInput: document.querySelector("#itemCategoryInput"),
  itemTypeInput: document.querySelector("#itemTypeInput"),
  itemLocationInput: document.querySelector("#itemLocationInput"),
  editableSelects: document.querySelectorAll("[data-editable-select]"),
  categoryOptions: document.querySelector("#categoryOptions"),
  typeOptions: document.querySelector("#typeOptions"),
  locationOptions: document.querySelector("#locationOptions"),
  tagOptions: document.querySelector("#tagOptions"),
  itemColorChips: document.querySelector("#itemColorChips"),
  colorNamesInput: document.querySelector("#colorNamesInput"),
  emptyTemplate: document.querySelector("#emptyTemplate"),
};

function isMaster() {
  return currentRole === "master";
}

function isGuest() {
  return currentRole === "guest";
}

function isPublicBoard() {
  return currentRole === "public";
}

function isBoardHash() {
  return window.location.hash.startsWith("#board=");
}

function roleLabel() {
  if (isMaster()) return "Master";
  if (isGuest()) return "Guest";
  return "Public board";
}

function requireSupabase() {
  if (!supabaseClient) {
    throw new Error("Supabase is not configured. Check supabase-config.js and the Supabase CDN script.");
  }
}

function rememberRole(role) {
  localStorage.setItem(AUTH_KEY, role);
  localStorage.setItem(AUTH_EXPIRES_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
}

function forgetRole() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_EXPIRES_KEY);
}

function getRememberedRole() {
  const expires = Number(localStorage.getItem(AUTH_EXPIRES_KEY) || 0);
  if (!expires || Date.now() > expires) {
    forgetRole();
    return "";
  }
  return localStorage.getItem(AUTH_KEY) || "";
}

function item(id, name, brand, category, type, material, colors, location, tags) {
  return { id, name, brand, category, type, material, colors, location, tags };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.items?.length) return saved;
  } catch (error) {
    console.warn("Could not load saved closet", error);
  }
  return structuredClone(defaultState);
}

async function loadCloudState() {
  requireSupabase();
  const { data, error } = await supabaseClient.from("closet_state").select("data").eq("id", CLOUD_STATE_ID).maybeSingle();
  if (error) throw error;
  if (data?.data?.items?.length) {
    state = normalizeState(data.data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    await saveCloudState();
  }
}

async function saveCloudState() {
  if (!supabaseClient || !currentUser || isPublicBoard()) return;
  const payload = {
    id: CLOUD_STATE_ID,
    data: state,
  };
  const { error } = await supabaseClient.from("closet_state").upsert(payload, { onConflict: "id" });
  if (error) console.warn("Cloud save failed", error);
}

function scheduleCloudSave() {
  if (!supabaseClient || !currentUser || isPublicBoard()) return;
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = window.setTimeout(saveCloudState, 450);
}

function normalizeState(raw) {
  const migratedBoards =
    raw.boards ||
    raw.outfits?.map((outfit) => ({
      id: outfit.id,
      name: outfit.name,
      notes: outfit.occasion || "",
      itemIds: outfit.itemIds || [],
    })) ||
    [];
  return {
    ...structuredClone(defaultState),
    ...raw,
    outfits: raw.outfits || structuredClone(defaultState.outfits),
    boards: migratedBoards,
    activeTag: raw.activeTag || "",
    selectedLocation: raw.selectedLocation || "",
    hiddenOptions: {
      category: raw.hiddenOptions?.category || [],
      type: raw.hiddenOptions?.type || [],
      location: raw.hiddenOptions?.location || [],
    },
  };
}

function initializeAccess() {
  if (isBoardHash()) {
    currentRole = getRememberedRole() || "public";
    syncPermissions();
    renderAll();
    handleHash();
    return;
  }

  const savedRole = getRememberedRole();
  if (savedRole === "master" || savedRole === "guest") {
    currentRole = savedRole;
    syncPermissions();
    renderAll();
    if (isGuest()) setView("closet");
    return;
  }

  syncPermissions();
}

async function loadRoleForUser() {
  const { data, error } = await supabaseClient.from("profiles").select("role").eq("user_id", currentUser.id).maybeSingle();
  if (error) throw error;
  if (!data?.role) {
    throw new Error(`This login does not have a closet role yet. Add user UUID ${currentUser.id} to public.profiles as master or guest.`);
  }
  currentRole = data.role;
  rememberRole(currentRole);
}

async function initializeSupabaseAccess() {
  if (!supabaseClient) {
    initializeAccess();
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  if (data.session?.user) {
    currentUser = data.session.user;
    try {
      await loadRoleForUser();
      await loadCloudState();
      syncPermissions();
      renderAll();
      if (isBoardHash()) handleHash();
      if (isGuest()) setView("closet");
      return;
    } catch (error) {
      console.warn("Could not restore Supabase session", error);
      await supabaseClient.auth.signOut();
      currentUser = null;
      currentRole = "";
    }
  }

  if (isBoardHash()) {
    currentRole = "public";
    syncPermissions();
    renderAll();
    handleHash();
  } else {
    syncPermissions();
  }
}

function locationsFor(entry) {
  return entry.locations?.length ? entry.locations : entry.location ? [entry.location] : [];
}

function locationText(entry) {
  return locationsFor(entry).join(", ");
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  scheduleCloudSave();
}

function slug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function getItem(id) {
  return state.items.find((entry) => entry.id === id);
}

function colorNameFromHex(hex) {
  return colorOptions.find(([, value]) => value.toLowerCase() === hex?.toLowerCase())?.[0] || "";
}

function colorValueFromName(name) {
  return colorOptions.find(([label]) => label.toLowerCase() === name?.toLowerCase())?.[1] || "";
}

function cleanText(value) {
  return String(value || "")
    .replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function tagsFromText(value) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function listFromText(value) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function renderGarment(entry, small = false) {
  if (entry.image) return `<img alt="${entry.name}" src="${entry.image}">`;
  const color = entry.colors?.[0] || "#b8b8b8";
  const stroke = color.toLowerCase() === "#242424" ? "#565656" : "rgba(32,36,33,.32)";
  const category = entry.category.toLowerCase();
  const type = entry.type.toLowerCase();
  const height = small ? 108 : 164;

  if (category.includes("bottom")) {
    return `<svg class="garment-svg" viewBox="0 0 160 ${height}" role="img" aria-label="${entry.type}">
      <path d="M50 16h60l14 132H92L80 64 68 148H36L50 16Z" fill="${color}" stroke="${stroke}" stroke-width="3"/>
      <path d="M50 16h60M80 18v46" stroke="${stroke}" stroke-width="3" fill="none"/>
    </svg>`;
  }

  if (category.includes("accessories")) {
    return `<svg class="garment-svg" viewBox="0 0 160 ${height}" role="img" aria-label="${entry.type}">
      <path d="M54 66c0-24 52-24 52 0" fill="none" stroke="${stroke}" stroke-width="9" stroke-linecap="round"/>
      <rect x="36" y="62" width="88" height="74" rx="14" fill="${color}" stroke="${stroke}" stroke-width="3"/>
      <circle cx="64" cy="80" r="4" fill="${stroke}"/><circle cx="96" cy="80" r="4" fill="${stroke}"/>
    </svg>`;
  }

  if (type.includes("dupatta")) {
    return `<svg class="garment-svg" viewBox="0 0 160 ${height}" role="img" aria-label="${entry.type}">
      <path d="M44 18c36 26 50 62 36 128M92 18c-12 42-10 86 24 128" fill="none" stroke="${color}" stroke-width="24" stroke-linecap="round"/>
      <path d="M42 20c36 26 52 62 38 128M94 20c-12 42-10 84 22 126" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }

  if (category.includes("cultural")) {
    return `<svg class="garment-svg" viewBox="0 0 160 ${height}" role="img" aria-label="${entry.type}">
      <path d="M80 18 54 76h52L80 18Z" fill="${color}" stroke="${stroke}" stroke-width="3"/>
      <path d="M54 78 34 148h92L106 78H54Z" fill="${color}" stroke="${stroke}" stroke-width="3"/>
      <path d="M50 104h60M43 126h74" stroke="rgba(255,255,255,.45)" stroke-width="3"/>
    </svg>`;
  }

  if (category.includes("outer")) {
    return `<svg class="garment-svg" viewBox="0 0 160 ${height}" role="img" aria-label="${entry.type}">
      <path d="M56 20h48l34 34-20 24-12-10v80H54V68L42 78 22 54 56 20Z" fill="${color}" stroke="${stroke}" stroke-width="3"/>
      <path d="M80 22v124M64 58h32" stroke="${stroke}" stroke-width="3"/>
    </svg>`;
  }

  return `<svg class="garment-svg" viewBox="0 0 160 ${height}" role="img" aria-label="${entry.type}">
    <path d="M56 20h48l34 34-20 24-14-12v82H56V66L42 78 22 54 56 20Z" fill="${color}" stroke="${stroke}" stroke-width="3"/>
    <path d="M66 22c4 10 24 10 28 0" fill="none" stroke="${stroke}" stroke-width="3"/>
  </svg>`;
}

function primaryImageFrom(images) {
  return images?.[0] || "";
}

function imagesForItem(entry) {
  return entry.images?.length ? entry.images : entry.image ? [entry.image] : [];
}

function renderItemDetailVisual(entry) {
  const images = imagesForItem(entry);
  if (!images.length) return `<div class="item-visual detail-visual">${renderGarment(entry)}</div>`;
  const index = Math.min(itemDetailImageIndexes[entry.id] || 0, images.length - 1);
  itemDetailImageIndexes[entry.id] = index;
  return `<div class="item-visual detail-visual item-carousel">
    <img alt="${entry.name}" src="${images[index]}">
    ${
      images.length > 1
        ? `<button class="carousel-button carousel-prev" type="button" data-item-image-step="-1" data-item-id="${entry.id}" aria-label="Previous photo">‹</button>
          <button class="carousel-button carousel-next" type="button" data-item-image-step="1" data-item-id="${entry.id}" aria-label="Next photo">›</button>
          <span class="carousel-count">${index + 1} / ${images.length}</span>`
        : ""
    }
  </div>`;
}

function renderEditPhotoPreview(entry) {
  const draft = editPhotoDraftFor(entry);
  if (!draft.length) return '<div data-edit-photo-section><p class="field-label">No saved photos yet.</p></div>';
  return `<div data-edit-photo-section><div class="upload-preview-grid edit-photo-grid">
    ${draft
      .map(
        (photo, index) => `<div class="upload-preview-tile" data-edit-photo-index="${index}">
          <button class="photo-remove-button" type="button" data-edit-photo-remove="${entry.id}:${index}" aria-label="Remove photo ${index + 1}">×</button>
          <img src="${photo.src}" alt="${entry.name} photo ${index + 1}">
          ${index === 0 ? '<span class="tag">Display image</span>' : ""}
        </div>`,
      )
      .join("")}
  </div></div>`;
}

function editPhotoDraftFor(entry) {
  if (!editPhotoDraftsByItem[entry.id]) {
    editPhotoDraftsByItem[entry.id] = imagesForItem(entry).map((src) => ({ type: "existing", src }));
  }
  return editPhotoDraftsByItem[entry.id];
}

function updateEditPhotoPreview(form, entry) {
  const section = form.querySelector("[data-edit-photo-section]");
  if (!section) return;
  section.outerHTML = renderEditPhotoPreview(entry);
}

function renderItemCard(entry, compact = false) {
  return `<article class="item-card clickable-card" data-item-card="${entry.id}" tabindex="0" aria-label="Open ${entry.name}">
    <div class="item-visual">${renderGarment(entry, compact)}</div>
    <div class="item-body">
      <div class="item-title-row">
        <strong>${entry.name}</strong>
        <span class="item-meta">${entry.category}</span>
      </div>
      <p class="item-meta">${entry.brand || "Unbranded"} · ${entry.type || "Item"} · ${locationText(entry)}</p>
      <div class="color-row">${(entry.colors || [])
        .map((color) => `<span class="color-swatch" title="${colorNameFromHex(color) || color}" style="--swatch:${color}"></span>`)
        .join("")}</div>
      <div class="tag-row">${(entry.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
    </div>
  </article>`;
}

function deleteItem(itemId) {
  const entry = getItem(itemId);
  if (!entry || !window.confirm(`Delete "${entry.name}"? This removes it from outfits and boards too.`)) return;
  state.items = state.items.filter((item) => item.id !== itemId);
  state.outfits.forEach((outfit) => {
    outfit.itemIds = outfit.itemIds.filter((id) => id !== itemId);
  });
  state.boards.forEach((board) => {
    board.itemIds = (board.itemIds || []).filter((id) => id !== itemId);
  });
  saveState();
  els.itemDetailDialog.close();
  renderAll();
}

function deleteOutfit(outfitId) {
  const outfit = state.outfits.find((entry) => entry.id === outfitId);
  if (!outfit || !window.confirm(`Delete outfit "${outfit.name}"?`)) return;
  state.outfits = state.outfits.filter((entry) => entry.id !== outfitId);
  state.boards.forEach((board) => {
    board.outfitIds = (board.outfitIds || []).filter((id) => id !== outfitId);
  });
  saveState();
  els.outfitDetailDialog.close();
  renderAll();
}

function deleteBoard(boardId) {
  const board = state.boards.find((entry) => entry.id === boardId);
  if (!board || !window.confirm(`Delete board "${board.name}"?`)) return;
  state.boards = state.boards.filter((entry) => entry.id !== boardId);
  activeBoardDetailId = "";
  saveState();
  renderBoards();
}

function syncPermissions() {
  const authenticated = Boolean(currentRole);
  els.authScreen.classList.toggle("is-hidden", authenticated);
  els.appShell.classList.toggle("is-hidden", !authenticated);
  els.rolePill.textContent = authenticated ? roleLabel() : "";
  els.logoutButton.classList.toggle("is-hidden", isPublicBoard());
  document.querySelector('[data-view="boards"]')?.classList.toggle("is-hidden", isGuest());
  els.addItemButton.classList.toggle("is-hidden", isPublicBoard());
  els.boardForm.classList.toggle("is-hidden", !isMaster() || Boolean(activeBoardDetailId));
}

function outfitOptionsForItem(itemId) {
  return state.outfits
    .filter((outfit) => !outfit.itemIds.includes(itemId))
    .map((outfit) => `<option value="${outfit.id}">${outfit.name}</option>`)
    .join("");
}

function openItemDetail(itemId, editOpen = false) {
  const entry = getItem(itemId);
  if (!entry) return;
  const outfitOptions = outfitOptionsForItem(entry.id);
  const currentOutfits = state.outfits.filter((outfit) => outfit.itemIds.includes(entry.id));
  els.itemDetailContent.innerHTML = `<div class="dialog-header">
      <div>
        <p class="eyebrow">${entry.category}</p>
        <h3>${entry.name}</h3>
      </div>
      <button class="icon-button" type="button" data-close-detail="item" aria-label="Close">×</button>
    </div>
    <div class="detail-layout">
      ${renderItemDetailVisual(entry)}
      <div class="detail-info">
        <p><strong>Brand</strong><span>${entry.brand || "Unbranded"}</span></p>
        <p><strong>Type</strong><span>${entry.type || "Item"}</span></p>
        <p><strong>Material</strong><span>${entry.material || "Not set"}</span></p>
        <p><strong>Locations</strong><span>${locationText(entry)}</span></p>
        <div class="color-row">${(entry.colors || [])
          .map((color) => `<span class="color-swatch" title="${colorNameFromHex(color) || color}" style="--swatch:${color}"></span>`)
          .join("")}</div>
        <div class="tag-row">${(entry.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      </div>
    </div>
    ${isMaster() ? `<button class="tiny-button" type="button" data-toggle-item-edit>Edit item</button>` : ""}
    <form class="edit-form ${editOpen ? "" : "is-hidden"}" data-item-edit="${entry.id}">
      <label>
        Name
        <input name="name" required value="${entry.name}">
      </label>
      <label>
        Brand
        <input name="brand" value="${entry.brand || ""}">
      </label>
      <label>
        Category
        <input name="category" list="categoryOptions" required value="${entry.category}">
      </label>
      <label>
        Type
        <input name="type" list="typeOptions" required value="${entry.type}">
      </label>
      <label>
        Material
        <input name="material" value="${entry.material || ""}">
      </label>
      <label>
        Locations
        <input name="locations" list="locationOptions" required value="${locationText(entry)}" placeholder="Home, Lake House">
      </label>
      <label>
        Tags
        <input name="tags" value="${(entry.tags || []).join(", ")}" placeholder="comma separated">
      </label>
      <label>
        Add photos
        <input name="photos" type="file" accept="image/*" multiple>
      </label>
      ${renderEditPhotoPreview(entry)}
      <p class="auth-error" data-edit-photo-error role="alert"></p>
      <button class="tiny-button" type="submit">Save item details</button>
      <button class="danger-button" type="button" data-delete-item="${entry.id}">Delete item</button>
    </form>
    ${isPublicBoard() ? "" : `<form class="item-action-form" data-detail-outfit-add="${entry.id}">
      <select name="outfitId" aria-label="Add ${entry.name} to outfit" ${outfitOptions ? "" : "disabled"}>
        <option value="">Add to outfit</option>
        ${outfitOptions || '<option value="">Already in every outfit</option>'}
      </select>
      <button class="tiny-button" type="submit" ${outfitOptions ? "" : "disabled"}>Add</button>
    </form>`}
    ${
      currentOutfits.length
        ? `<div class="detail-section">
            <p class="field-label">In outfits</p>
            <div class="tag-row">${currentOutfits.map((outfit) => `<span class="tag">${outfit.name}</span>`).join("")}</div>
          </div>`
        : ""
    }`;
  if (!els.itemDetailDialog.open) els.itemDetailDialog.showModal();
}

function searchMatches(entry, query) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);
  const haystack = [
    entry.name,
    entry.brand,
    entry.category,
    entry.type,
    entry.material,
    locationText(entry),
    ...(entry.colors || []).map(colorNameFromHex),
    ...(entry.tags || []),
  ]
    .join(" ")
    .toLowerCase();

  return terms.every((term) => {
    if (term.startsWith("!")) return !haystack.includes(term.slice(1));
    return haystack.includes(term);
  });
}

function filteredItems() {
  const category = els.categoryFilter.value;
  const location = els.locationFilter.value;
  const query = els.searchInput.value;
  return state.items.filter((entry) => {
    const categoryOk = !category || entry.category === category;
    const locationOk = !location || locationsFor(entry).includes(location);
    const tagOk = !state.activeTag || entry.tags.includes(state.activeTag);
    return categoryOk && locationOk && tagOk && searchMatches(entry, query);
  });
}

function renderDataLists() {
  const categories = optionValues("category", [...baseCategories, ...state.items.map((entry) => entry.category)]);
  const locations = optionValues("location", [...baseLocations, ...state.items.flatMap(locationsFor)]);
  const types = optionValues("type", [...baseTypes, ...state.items.map((entry) => entry.type)]);
  els.categoryOptions.innerHTML = categories.map((category) => `<option value="${category}"></option>`).join("");
  els.typeOptions.innerHTML = types.map((type) => `<option value="${type}"></option>`).join("");
  els.locationOptions.innerHTML = locations.map((location) => `<option value="${location}"></option>`).join("");
  renderEditableSelect("category", categories, "Select category");
  renderEditableSelect("type", types, "Select type");
  renderEditableSelect("location", locations, "Select location");
  els.tagOptions.innerHTML = unique([...state.items.flatMap((entry) => entry.tags), ...state.outfits.flatMap((outfit) => outfit.tags || [])])
    .map((tag) => `<option value="${tag}"></option>`)
    .join("");
  els.categoryFilter.innerHTML = `<option value="">All categories</option>${categories
    .map((category) => `<option>${category}</option>`)
    .join("")}`;
  els.locationFilter.innerHTML = `<option value="">All locations</option>${locations
    .map((location) => `<option>${location}</option>`)
    .join("")}`;
  renderTags();
}

function optionValues(key, values) {
  const hidden = new Set(state.hiddenOptions?.[key] || []);
  return unique(values).filter((value) => !hidden.has(value));
}

function inputForEditableSelect(key) {
  return key === "category" ? els.itemCategoryInput : key === "type" ? els.itemTypeInput : els.itemLocationInput;
}

function editableLabel(key) {
  return key === "category" ? "category" : key === "type" ? "type" : "location";
}

function renderEditableSelect(key, values, placeholder) {
  const input = inputForEditableSelect(key);
  const control = [...els.editableSelects].find((select) => select.dataset.editableSelect === key);
  if (!control) return;
  const selected = input.value;
  control.innerHTML = `<button class="editable-select-trigger" type="button" data-select-toggle="${key}">
      <span>${cleanText(selected || placeholder)}</span>
      <span aria-hidden="true">⌄</span>
    </button>
    <div class="editable-select-menu is-hidden" data-select-menu="${key}">
      ${values
        .map(
          (value) => `<div class="editable-option-row">
            <button class="editable-option" type="button" data-select-value="${cleanText(value)}">${cleanText(value)}</button>
            ${
              isMaster()
                ? `<button class="option-more" type="button" data-option-more="${key}" data-option-value="${cleanText(value)}" aria-label="Edit ${cleanText(value)}">...</button>`
                : ""
            }
            <div class="option-actions is-hidden">
              <button type="button" data-option-rename="${key}" data-option-value="${cleanText(value)}">Rename</button>
              <button type="button" data-option-delete="${key}" data-option-value="${cleanText(value)}">Delete</button>
            </div>
          </div>`,
        )
        .join("")}
      <button class="editable-option add-option" type="button" data-option-add="${key}">+ Add new</button>
    </div>`;
}

function closeEditableSelects() {
  document.querySelectorAll(".editable-select-menu, .option-actions").forEach((menu) => menu.classList.add("is-hidden"));
}

function replaceListValue(key, target, replacement, persist = true) {
  if (!target || !replacement || target === replacement) return;
  state.hiddenOptions[key] = unique([...(state.hiddenOptions[key] || []), target]).filter((value) => value !== replacement);
  state.items.forEach((entry) => {
    if (key === "location") {
      const nextLocations = locationsFor(entry).map((location) => (location === target ? replacement : location));
      entry.locations = [...new Set(nextLocations.filter(Boolean))];
      entry.location = entry.locations[0] || "";
      return;
    }
    if (entry[key] === target) entry[key] = replacement;
  });
  if (state.selectedLocation === target) state.selectedLocation = replacement;
  if (els.categoryFilter.value === target) els.categoryFilter.value = "";
  if (els.locationFilter.value === target) els.locationFilter.value = "";
  if (inputForEditableSelect(key).value === target) inputForEditableSelect(key).value = replacement;
  if (persist) saveState();
}

function deleteListValue(key, target) {
  const fallback = key === "category" ? "Uncategorized" : key === "type" ? "Item" : "Unassigned";
  replaceListValue(key, target, fallback, false);
  state.hiddenOptions[key] = unique([...(state.hiddenOptions[key] || []), target]);
  if (inputForEditableSelect(key).value === target) inputForEditableSelect(key).value = "";
  saveState();
  renderAll();
}

function revealOptionValue(key, value) {
  state.hiddenOptions[key] = (state.hiddenOptions[key] || []).filter((hiddenValue) => hiddenValue !== value);
}

function renderTags() {
  const tags = unique(state.items.flatMap((entry) => entry.tags)).slice(0, 18);
  els.tagFilter.innerHTML = `<option value="">All tags</option>${tags.map((tag) => `<option value="${tag}">${tag}</option>`).join("")}`;
  els.tagFilter.value = tags.includes(state.activeTag) ? state.activeTag : "";
}

function fillOutfitPieceFilters() {
  const categories = unique([...baseCategories, ...state.items.map((entry) => entry.category)]);
  const locations = unique(state.items.flatMap(locationsFor));
  const tags = unique(state.items.flatMap((entry) => entry.tags)).slice(0, 18);
  els.outfitPieceCategory.innerHTML = `<option value="">All categories</option>${categories.map((category) => `<option>${category}</option>`).join("")}`;
  els.outfitPieceLocation.innerHTML = `<option value="">All locations</option>${locations.map((location) => `<option>${location}</option>`).join("")}`;
  els.outfitPieceTag.innerHTML = `<option value="">All tags</option>${tags.map((tag) => `<option value="${tag}">${tag}</option>`).join("")}`;
}

function renderColorChips() {
  els.itemColorChips.innerHTML = colorOptions
    .map(
      ([name, value]) => `<label class="color-choice">
        <input type="checkbox" name="colors" value="${value}" data-color-name="${name}">
        <span class="color-swatch" style="--swatch:${value}"></span>
        <span>${name}</span>
      </label>`,
    )
    .join("");
  updateSelectedColorNames();
}

function updateSelectedColorNames() {
  const names = [...els.itemColorChips.querySelectorAll("input:checked")].map((checkbox) => checkbox.dataset.colorName);
  els.colorNamesInput.value = names.join(", ");
}

function renderCloset() {
  const items = filteredItems();
  els.closetGrid.innerHTML = items.length ? items.map((entry) => renderItemCard(entry)).join("") : els.emptyTemplate.innerHTML;
}

function renderStats() {
  const locations = unique(state.items.flatMap(locationsFor));
  els.totalItems.textContent = state.items.length;
  els.totalLocations.textContent = locations.length;

  const max = Math.max(...locations.map((location) => state.items.filter((entry) => locationsFor(entry).includes(location)).length), 1);
  els.locationStats.innerHTML = locations
    .map((location, index) => {
      const count = state.items.filter((entry) => locationsFor(entry).includes(location)).length;
      const color = ["var(--city)", "var(--lake)", "var(--storage)", "var(--accent)"][index % 4];
      return `<div class="location-stat">
        <div><strong>${location}</strong><span>${count}</span></div>
        <div class="meter"><span style="width:${(count / max) * 100}%;background:${color}"></span></div>
      </div>`;
    })
    .join("");
}

function picker(name, query = "") {
  return state.items
    .filter((entry) => searchMatches(entry, query))
    .map(
      (entry) => `<label class="picker-tile">
        <input type="checkbox" name="${name}" value="${entry.id}">
        <span class="mini-swatch" style="--swatch:${entry.colors?.[0] || "#ddd"}"></span>
        <span>${entry.name}</span>
      </label>`,
    )
    .join("");
}

function renderLocations() {
  const locations = unique(state.items.flatMap(locationsFor));
  if (!state.selectedLocation || !locations.includes(state.selectedLocation)) {
    state.selectedLocation = locations[0] || "";
  }

  els.locationButtons.innerHTML = locations
    .map((location) => {
      const count = state.items.filter((entry) => locationsFor(entry).includes(location)).length;
      return `<button class="location-button ${location === state.selectedLocation ? "is-active" : ""}" data-location="${location}" type="button">${location} · ${count}</button>`;
    })
    .join("");

  const items = state.items.filter((entry) => locationsFor(entry).includes(state.selectedLocation));
  els.locationBoard.innerHTML = state.selectedLocation
    ? `<div class="section-heading">
        <div>
          <p class="eyebrow">Location board</p>
          <h3>${state.selectedLocation}</h3>
        </div>
        <span class="tag">${items.length} items</span>
      </div>
      <div class="closet-grid">${items.map((entry) => renderItemCard(entry, true)).join("")}</div>`
    : els.emptyTemplate.innerHTML;
}

function renderOutfits() {
  els.outfitPicker.innerHTML = picker("outfitItems", els.outfitItemSearch.value) || els.emptyTemplate.innerHTML;
  els.outfitGrid.innerHTML = state.outfits.length
    ? state.outfits
        .map((outfit) => {
          const items = outfit.itemIds.map(getItem).filter(Boolean);
          return `<article class="outfit-card clickable-card" data-outfit-card="${outfit.id}" tabindex="0" aria-label="Open ${outfit.name}">
            <div class="outfit-preview">
              ${items.map((entry) => `<div class="item-visual">${renderGarment(entry, true)}</div>`).join("")}
            </div>
            <div class="item-body">
              <div class="item-title-row">
                <strong>${outfit.name}</strong>
                <span class="item-meta">${outfit.occasion || "Anytime"}</span>
              </div>
              <p class="item-meta">${items.map((entry) => entry.type).join(" + ")}</p>
              ${outfit.notes ? `<p class="item-meta">${outfit.notes}</p>` : ""}
              <div class="tag-row">${(outfit.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
            </div>
          </article>`;
        })
        .join("")
    : els.emptyTemplate.innerHTML;
}

function openOutfitDetail(outfitId) {
  const outfit = state.outfits.find((entry) => entry.id === outfitId);
  if (!outfit) return;
  const items = outfit.itemIds.map(getItem).filter(Boolean);
  els.outfitDetailContent.innerHTML = `<div class="dialog-header">
      <div>
        <p class="eyebrow">${outfit.occasion || "Outfit"}</p>
        <h3>${outfit.name}</h3>
      </div>
      <button class="icon-button" type="button" data-close-detail="outfit" aria-label="Close">×</button>
    </div>
    <div class="tag-row">${(outfit.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
    ${outfit.notes ? `<p class="item-meta">${outfit.notes}</p>` : ""}
    ${isMaster() ? `<button class="tiny-button" type="button" data-toggle-outfit-edit>Edit outfit</button>` : ""}
    <form class="edit-form is-hidden" data-outfit-edit="${outfit.id}">
      <div class="detail-section">
        <p class="field-label">Tags</p>
        <div class="tag-row">
          ${(outfit.tags || [])
            .map((tag) => `<button class="chip" type="button" data-remove-outfit-tag="${outfit.id}" data-tag="${tag}">${tag} ×</button>`)
            .join("")}
        </div>
      </div>
      <label>
        Add tag
        <input name="newTag" list="tagOptions" placeholder="Type or choose a tag">
      </label>
      <label>
        Notes
        <textarea name="notes" rows="3" placeholder="Add notes about this outfit">${outfit.notes || ""}</textarea>
      </label>
      <button class="tiny-button" type="submit">Save outfit details</button>
      <button class="danger-button" type="button" data-delete-outfit="${outfit.id}">Delete outfit</button>
    </form>
    ${isPublicBoard() ? "" : `<button class="primary-button full-width" type="button" data-open-outfit-piece-picker="${outfit.id}">Add piece</button>`}
    <div class="closet-grid detail-grid">${items.map((entry) => renderItemCard(entry, true)).join("")}</div>`;
  if (!els.outfitDetailDialog.open) els.outfitDetailDialog.showModal();
}

function outfitPieceMatches(entry, outfit) {
  const category = els.outfitPieceCategory.value;
  const location = els.outfitPieceLocation.value;
  const tag = els.outfitPieceTag.value;
  const query = els.outfitPieceSearch.value;
  const available = !outfit.itemIds.includes(entry.id);
  const categoryOk = !category || entry.category === category;
  const locationOk = !location || locationsFor(entry).includes(location);
  const tagOk = !tag || entry.tags.includes(tag);
  return available && categoryOk && locationOk && tagOk && searchMatches(entry, query);
}

function renderOutfitPiecePicker() {
  const outfit = state.outfits.find((entry) => entry.id === activeOutfitPickerId);
  if (!outfit) return;
  const items = state.items.filter((entry) => outfitPieceMatches(entry, outfit));
  els.outfitPieceGrid.innerHTML = items.length
    ? items
        .map(
          (entry) => `<label class="selectable-card">
            <input type="checkbox" name="itemIds" value="${entry.id}">
            <span class="select-check">✓</span>
            ${renderItemCard(entry, true)}
          </label>`,
        )
        .join("")
    : els.emptyTemplate.innerHTML;
}

function openOutfitPiecePicker(outfitId) {
  const outfit = state.outfits.find((entry) => entry.id === outfitId);
  if (!outfit) return;
  activeOutfitPickerId = outfit.id;
  els.outfitPieceTitle.textContent = `Add pieces to ${outfit.name}`;
  els.outfitPieceSearch.value = "";
  fillOutfitPieceFilters();
  renderOutfitPiecePicker();
  els.outfitPieceDialog.showModal();
}

function renderBoards() {
  syncPermissions();
  if (activeBoardDetailId && state.boards.some((board) => board.id === activeBoardDetailId)) {
    renderBoardDetail(activeBoardDetailId);
    return;
  }
  activeBoardDetailId = "";
  els.boardForm.classList.toggle("is-hidden", !isMaster());
  els.boardGrid.classList.remove("is-hidden");
  els.boardDetailView.classList.add("is-hidden");
  els.boardGrid.innerHTML = state.boards.length
    ? state.boards
        .map((board) => {
          const items = (board.itemIds || []).map(getItem).filter(Boolean);
          const outfits = (board.outfitIds || []).map((id) => state.outfits.find((outfit) => outfit.id === id)).filter(Boolean);
          const boardThings = [...items, ...outfits];
          const url = shareUrl(board.id);
          return `<article class="outfit-card clickable-card" id="board-${board.id}" data-board-card="${board.id}" tabindex="0" aria-label="Open ${board.name}">
            ${
              boardThings.length
                ? `<div class="outfit-preview">
                    ${items.map((entry) => `<div class="item-visual">${renderGarment(entry, true)}</div>`).join("")}
                    ${outfits
                      .flatMap((outfit) => outfit.itemIds.map(getItem).filter(Boolean).slice(0, 2))
                      .map((entry) => `<div class="item-visual">${renderGarment(entry, true)}</div>`)
                      .join("")}
                  </div>`
                : `<div class="board-empty-preview">
                    <strong>Empty board</strong>
                    <span>Add pieces as you find them.</span>
                  </div>`
            }
            <div class="item-body">
              <div class="item-title-row">
                <strong>${board.name}</strong>
                <span class="item-meta">${boardThings.length} saved</span>
              </div>
              <p class="item-meta">${board.notes || "Custom clothing board"}</p>
              <span class="item-meta">${url.split("#")[1]}</span>
            </div>
          </article>`;
        })
        .join("")
    : els.emptyTemplate.innerHTML;
}

function renderBoardDetail(boardId) {
  const board = state.boards.find((entry) => entry.id === boardId);
  if (!board) return;
  activeBoardDetailId = board.id;
  els.boardForm.classList.add("is-hidden");
  els.boardGrid.classList.add("is-hidden");
  els.boardDetailView.classList.remove("is-hidden");
  const items = (board.itemIds || []).map(getItem).filter(Boolean);
  const outfits = (board.outfitIds || []).map((id) => state.outfits.find((outfit) => outfit.id === id)).filter(Boolean);
  els.boardDetailView.innerHTML = `<div class="section-heading">
    <div>
      <button class="tiny-button" type="button" data-board-back>Back to boards</button>
      <p class="eyebrow">Board</p>
      <h3>${board.name}</h3>
      <p class="item-meta">${board.notes || "Custom clothing board"}</p>
    </div>
    <div class="share-row">
      ${isMaster() ? `<button class="board-plus static-plus" type="button" data-open-board-picker="${board.id}" aria-label="Add to ${board.name}">+</button>` : ""}
      ${isMaster() ? `<button class="danger-button compact-danger" type="button" data-delete-board="${board.id}">Delete board</button>` : ""}
      <button class="tiny-button" type="button" data-share-board="${board.id}">Copy link</button>
    </div>
  </div>
  ${
    outfits.length
      ? `<div class="detail-section">
          <p class="field-label">Outfits</p>
          <div class="board-grid">${outfits
            .map((outfit) => {
              const pieces = outfit.itemIds.map(getItem).filter(Boolean).slice(0, 4);
              return `<article class="outfit-card clickable-card" data-outfit-card="${outfit.id}" tabindex="0">
                <div class="outfit-preview">${pieces.map((entry) => `<div class="item-visual">${renderGarment(entry, true)}</div>`).join("")}</div>
                <div class="item-body">
                  <div class="item-title-row"><strong>${outfit.name}</strong><span class="item-meta">Outfit</span></div>
                  ${isMaster() ? `<button class="chip" type="button" data-remove-board-outfit="${board.id}" data-outfit="${outfit.id}">${outfit.name} ×</button>` : `<span class="tag">${outfit.name}</span>`}
                </div>
              </article>`;
            })
            .join("")}</div>
        </div>`
      : ""
  }
  <div class="detail-section">
    <p class="field-label">Items</p>
    <div class="closet-grid detail-grid">${items.map((entry) => `${renderItemCard(entry, true)}`).join("") || els.emptyTemplate.innerHTML}</div>
    <div class="board-item-list">${items
      .map((entry) =>
        isMaster()
          ? `<button class="chip" type="button" data-remove-board-item="${board.id}" data-item="${entry.id}">${entry.name} ×</button>`
          : `<span class="tag">${entry.name}</span>`,
      )
      .join("")}</div>
  </div>`;
}

function shareUrl(boardId) {
  const base = window.location.href.split("#")[0];
  return `${base}#board=${encodeURIComponent(boardId)}`;
}

function renderBoardPicker() {
  const board = state.boards.find((entry) => entry.id === activeBoardPickerId);
  if (!board) return;
  const query = els.boardPickerSearch.value.toLowerCase();
  const itemCards = state.items
    .filter((entry) => !(board.itemIds || []).includes(entry.id) && searchMatches(entry, query))
    .map(
      (entry) => `<label class="selectable-card">
        <input type="checkbox" name="itemIds" value="${entry.id}">
        <span class="select-check">✓</span>
        ${renderItemCard(entry, true)}
      </label>`,
    );
  const outfitCards = state.outfits
    .filter((outfit) => !(board.outfitIds || []).includes(outfit.id) && [outfit.name, outfit.occasion, outfit.notes, ...(outfit.tags || [])].join(" ").toLowerCase().includes(query))
    .map((outfit) => {
      const pieces = outfit.itemIds.map(getItem).filter(Boolean).slice(0, 4);
      return `<label class="selectable-card">
        <input type="checkbox" name="outfitIds" value="${outfit.id}">
        <span class="select-check">✓</span>
        <article class="outfit-card">
          <div class="outfit-preview">${pieces.map((entry) => `<div class="item-visual">${renderGarment(entry, true)}</div>`).join("")}</div>
          <div class="item-body"><strong>${outfit.name}</strong><p class="item-meta">Outfit · ${outfit.occasion || "Anytime"}</p></div>
        </article>
      </label>`;
    });
  els.boardPickerGrid.innerHTML = [...itemCards, ...outfitCards].join("") || els.emptyTemplate.innerHTML;
}

function openBoardPicker(boardId) {
  const board = state.boards.find((entry) => entry.id === boardId);
  if (!board) return;
  activeBoardPickerId = board.id;
  els.boardPickerTitle.textContent = `Add to ${board.name}`;
  els.boardPickerSearch.value = "";
  renderBoardPicker();
  els.boardPickerDialog.showModal();
}

function renderAll() {
  renderDataLists();
  renderColorChips();
  renderCloset();
  renderOutfits();
  renderLocations();
  renderBoards();
  renderStats();
}

function setView(viewName) {
  if (isGuest() && viewName === "boards") viewName = "closet";
  els.navTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.view === viewName));
  Object.entries(els.views).forEach(([name, view]) => view.classList.toggle("is-visible", name === viewName));
  els.viewTitle.textContent =
    viewName === "closet" ? "Closet" : viewName === "outfits" ? "Outfits" : viewName === "locations" ? "Locations" : "Boards";
}

async function fileToDataUrl(file) {
  if (!file || !file.size) return "";
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compressImage(file, maxSize = 1200, quality = 0.78) {
  if (!file || !file.size) return null;
  if (!window.createImageBitmap) return null;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

function fileExtensionForUpload(file, compressed) {
  if (compressed) return "jpg";
  const fromName = file.name?.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/heic") return "heic";
  if (file.type === "image/heif") return "heif";
  return "jpg";
}

async function uploadItemPhoto(file, itemId) {
  if (!file || !file.size) return "";
  if (!supabaseClient || !currentUser) {
    return fileToDataUrl(file);
  }
  let uploadBody = file;
  let compressed = false;
  try {
    const blob = await compressImage(file);
    if (blob) {
      uploadBody = blob;
      compressed = true;
    }
  } catch (error) {
    console.warn("Photo compression failed; uploading original file", error);
  }
  const contentType = compressed ? "image/jpeg" : file.type || "application/octet-stream";
  const path = `${currentUser.id}/${itemId}-${Date.now()}.${fileExtensionForUpload(file, compressed)}`;
  const { error } = await supabaseClient.storage.from(PHOTO_BUCKET).upload(path, uploadBody, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabaseClient.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function uploadItemPhotos(files, itemId) {
  const urls = [];
  for (const [index, file] of files.slice(0, 3).entries()) {
    urls.push(await uploadItemPhoto(file, `${itemId}-${index + 1}`));
  }
  return urls.filter(Boolean);
}

async function renderPhotoPreviews() {
  if (!selectedPhotoFiles.length) {
    els.itemPhotoPreviewWrap.innerHTML = "";
    els.itemPhotoPreviewWrap.classList.add("is-hidden");
    return;
  }
  const previews = await Promise.all(selectedPhotoFiles.map((file) => fileToDataUrl(file)));
  els.itemPhotoPreviewWrap.innerHTML = previews
    .map(
      (src, index) => `<div class="upload-preview-tile" data-photo-index="${index}">
        <button class="photo-remove-button" type="button" data-photo-remove="${index}" aria-label="Remove photo ${index + 1}">×</button>
        <img src="${src}" alt="Selected clothing preview ${index + 1}">
        ${index === 0 ? '<span class="tag">Display image</span>' : ""}
      </div>`,
    )
    .join("");
  els.itemPhotoPreviewWrap.classList.remove("is-hidden");
}

async function moveSelectedPhoto(fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
  if (fromIndex >= selectedPhotoFiles.length || toIndex >= selectedPhotoFiles.length) return;
  const [movedPhoto] = selectedPhotoFiles.splice(fromIndex, 1);
  selectedPhotoFiles.splice(toIndex, 0, movedPhoto);
  await renderPhotoPreviews();
}

function handleHash() {
  const match = window.location.hash.match(/^#board=(.+)$/);
  if (!match) return;
  setView("boards");
  const id = decodeURIComponent(match[1]);
  activeBoardDetailId = id;
  renderBoards();
}

els.navTabs.forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.view)));
els.authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) {
    els.authError.textContent = "Supabase is not configured.";
    return;
  }
  try {
    els.authError.textContent = "";
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: els.emailInput.value.trim(),
      password: els.passwordInput.value,
    });
    if (error) throw error;
    currentUser = data.user;
    await loadRoleForUser();
    await loadCloudState();
    els.emailInput.value = "";
    els.passwordInput.value = "";
    syncPermissions();
    renderAll();
    if (isGuest()) setView("closet");
  } catch (error) {
    els.authError.textContent = error.message || "Login failed.";
  }
});

els.quickMasterButton.addEventListener("click", () => {
  quickMasterClicks += 1;
  window.clearTimeout(quickMasterClickTimer);
  quickMasterClickTimer = window.setTimeout(() => {
    quickMasterClicks = 0;
  }, 1200);

  if (quickMasterClicks < 3) return;
  quickMasterClicks = 0;

  const password = window.prompt("Master password");
  if (password !== LOCAL_MASTER_PASSWORD) {
    els.authError.textContent = "That password did not work.";
    return;
  }
  currentRole = "master";
  currentUser = null;
  rememberRole(currentRole);
  els.authError.textContent = "";
  syncPermissions();
  renderAll();
});

els.logoutButton.addEventListener("click", async () => {
  if (supabaseClient) await supabaseClient.auth.signOut();
  forgetRole();
  currentUser = null;
  currentRole = "";
  activeBoardDetailId = "";
  syncPermissions();
});

els.addItemButton.addEventListener("click", () => els.itemDialog.showModal());
els.closeDialogButton.addEventListener("click", () => els.itemDialog.close());

els.itemPhotoInput.addEventListener("change", async () => {
  const newFiles = [...(els.itemPhotoInput.files || [])];
  selectedPhotoFiles = [...selectedPhotoFiles, ...newFiles].slice(0, 3);
  els.itemPhotoInput.value = "";
  await renderPhotoPreviews();
});

els.itemPhotoPreviewWrap.addEventListener("click", async (event) => {
  const removeButton = event.target.closest("[data-photo-remove]");
  if (!removeButton) return;
  selectedPhotoFiles.splice(Number(removeButton.dataset.photoRemove), 1);
  await renderPhotoPreviews();
});

els.itemPhotoPreviewWrap.addEventListener("pointerdown", (event) => {
  if (event.target.closest("[data-photo-remove]")) return;
  const tile = event.target.closest("[data-photo-index]");
  if (!tile) return;
  draggedPhotoIndex = Number(tile.dataset.photoIndex);
  tile.classList.add("is-dragging");
  tile.setPointerCapture?.(event.pointerId);
});

els.itemPhotoPreviewWrap.addEventListener("pointerup", async (event) => {
  if (draggedPhotoIndex === null) return;
  const sourceIndex = draggedPhotoIndex;
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const tile = target?.closest?.("[data-photo-index]");
  const targetIndex = tile ? Number(tile.dataset.photoIndex) : sourceIndex;
  draggedPhotoIndex = null;
  els.itemPhotoPreviewWrap.querySelectorAll(".is-dragging").forEach((draggedTile) => {
    draggedTile.classList.remove("is-dragging");
  });
  await moveSelectedPhoto(sourceIndex, targetIndex);
});

els.itemPhotoPreviewWrap.addEventListener("pointercancel", () => {
  draggedPhotoIndex = null;
  els.itemPhotoPreviewWrap.querySelectorAll(".is-dragging").forEach((tile) => {
    tile.classList.remove("is-dragging");
  });
});

[els.searchInput, els.categoryFilter, els.locationFilter].forEach((input) => input.addEventListener("input", renderCloset));

els.outfitItemSearch.addEventListener("input", renderOutfits);

els.tagFilter.addEventListener("change", () => {
  state.activeTag = els.tagFilter.value;
  saveState();
  renderCloset();
});

els.itemColorChips.addEventListener("change", updateSelectedColorNames);

els.itemForm.addEventListener("click", (event) => {
  const toggle = event.target.closest("[data-select-toggle]");
  if (toggle) {
    const menu = toggle.nextElementSibling;
    const willOpen = menu.classList.contains("is-hidden");
    closeEditableSelects();
    menu.classList.toggle("is-hidden", !willOpen);
    return;
  }

  const option = event.target.closest("[data-select-value]");
  if (option && !event.target.closest("[data-option-more]")) {
    const key = option.closest("[data-editable-select]").dataset.editableSelect;
    inputForEditableSelect(key).value = option.dataset.selectValue;
    closeEditableSelects();
    renderDataLists();
    return;
  }

  const moreButton = event.target.closest("[data-option-more]");
  if (moreButton) {
    const actions = moreButton.parentElement.querySelector(".option-actions");
    document.querySelectorAll(".option-actions").forEach((menu) => {
      if (menu !== actions) menu.classList.add("is-hidden");
    });
    actions.classList.toggle("is-hidden");
    return;
  }

  const addButton = event.target.closest("[data-option-add]");
  if (addButton) {
    const key = addButton.dataset.optionAdd;
    const value = window.prompt(`New ${editableLabel(key)}`);
    if (!value?.trim()) return;
    inputForEditableSelect(key).value = value.trim();
    closeEditableSelects();
    renderDataLists();
    return;
  }

  const renameButton = event.target.closest("[data-option-rename]");
  if (renameButton) {
    const key = renameButton.dataset.optionRename;
    const oldValue = renameButton.dataset.optionValue;
    const value = window.prompt(`Rename ${oldValue}`, oldValue);
    if (!value?.trim() || value.trim() === oldValue) return;
    replaceListValue(key, oldValue, value.trim());
    closeEditableSelects();
    renderAll();
    return;
  }

  const deleteButton = event.target.closest("[data-option-delete]");
  if (deleteButton) {
    const key = deleteButton.dataset.optionDelete;
    const value = deleteButton.dataset.optionValue;
    if (!window.confirm(`Delete "${value}" from ${editableLabel(key)} options?`)) return;
    deleteListValue(key, value);
  }
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".editable-select")) return;
  closeEditableSelects();
});

els.locationButtons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-location]");
  if (!button) return;
  state.selectedLocation = button.dataset.location;
  saveState();
  renderLocations();
});

function handleItemCardOpen(event) {
  const card = event.target.closest("[data-item-card]");
  if (!card) return;
  openItemDetail(card.dataset.itemCard);
}

els.closetGrid.addEventListener("click", handleItemCardOpen);
els.locationBoard.addEventListener("click", handleItemCardOpen);
els.outfitDetailContent.addEventListener("click", handleItemCardOpen);
els.closetGrid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  handleItemCardOpen(event);
});

els.itemDetailContent.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-detail='item']")) els.itemDetailDialog.close();
  if (event.target.closest("[data-toggle-item-edit]")) {
    els.itemDetailContent.querySelector("[data-item-edit]")?.classList.toggle("is-hidden");
  }
  const photoRemoveButton = event.target.closest("[data-edit-photo-remove]");
  if (photoRemoveButton) {
    const [itemId, indexText] = photoRemoveButton.dataset.editPhotoRemove.split(":");
    const entry = getItem(itemId);
    if (!entry) return;
    const editForm = event.target.closest("[data-item-edit]");
    editPhotoDraftFor(entry).splice(Number(indexText), 1);
    if (editForm) updateEditPhotoPreview(editForm, entry);
    return;
  }
  const imageTile = event.target.closest("[data-edit-photo-index]");
  if (imageTile && !event.target.closest("[data-edit-photo-remove]")) {
    return;
  }
  const imageButton = event.target.closest("[data-item-image-step]");
  if (imageButton) {
    const entry = getItem(imageButton.dataset.itemId);
    const images = entry ? imagesForItem(entry) : [];
    if (!entry || images.length < 2) return;
    const currentIndex = itemDetailImageIndexes[entry.id] || 0;
    itemDetailImageIndexes[entry.id] = (currentIndex + Number(imageButton.dataset.itemImageStep) + images.length) % images.length;
    openItemDetail(entry.id);
  }
  const deleteButton = event.target.closest("[data-delete-item]");
  if (deleteButton) deleteItem(deleteButton.dataset.deleteItem);
});

els.itemDetailContent.addEventListener("pointerdown", (event) => {
  if (event.target.closest("[data-edit-photo-remove]")) return;
  const tile = event.target.closest("[data-edit-photo-index]");
  const editForm = event.target.closest("[data-item-edit]");
  if (!tile || !editForm) return;
  draggedEditPhoto = {
    itemId: editForm.dataset.itemEdit,
    index: Number(tile.dataset.editPhotoIndex),
  };
  tile.classList.add("is-dragging");
  tile.setPointerCapture?.(event.pointerId);
});

els.itemDetailContent.addEventListener("pointerup", (event) => {
  if (!draggedEditPhoto) return;
  const source = draggedEditPhoto;
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const tile = target?.closest?.("[data-edit-photo-index]");
  const editForm = event.target.closest("[data-item-edit]") || els.itemDetailContent.querySelector(`[data-item-edit="${source.itemId}"]`);
  const entry = getItem(source.itemId);
  const targetIndex = tile ? Number(tile.dataset.editPhotoIndex) : source.index;
  draggedEditPhoto = null;
  els.itemDetailContent.querySelectorAll(".is-dragging").forEach((draggedTile) => draggedTile.classList.remove("is-dragging"));
  if (!entry || !editForm || targetIndex === source.index) return;
  const draft = editPhotoDraftFor(entry);
  const [movedPhoto] = draft.splice(source.index, 1);
  draft.splice(targetIndex, 0, movedPhoto);
  updateEditPhotoPreview(editForm, entry);
});

els.itemDetailContent.addEventListener("pointercancel", () => {
  draggedEditPhoto = null;
  els.itemDetailContent.querySelectorAll(".is-dragging").forEach((tile) => tile.classList.remove("is-dragging"));
});

els.itemDetailContent.addEventListener("change", async (event) => {
  const input = event.target.closest('[data-item-edit] input[name="photos"]');
  if (!input) return;
  const editForm = input.closest("[data-item-edit]");
  const entry = getItem(editForm.dataset.itemEdit);
  if (!entry) return;
  const editPhotoError = editForm.querySelector("[data-edit-photo-error]");
  if (editPhotoError) editPhotoError.textContent = "";
  const draft = editPhotoDraftFor(entry);
  const newFiles = [...(input.files || [])];
  const availableSlots = Math.max(0, 3 - draft.length);
  if (newFiles.length > availableSlots) {
    const message =
      availableSlots === 0
        ? "Please remove a photo before uploading another, limit is 3."
        : `You can add ${availableSlots} more photo${availableSlots === 1 ? "" : "s"}, limit is 3.`;
    if (editPhotoError) editPhotoError.textContent = message;
    input.value = "";
    updateEditPhotoPreview(editForm, entry);
    return;
  }
  const newDraftPhotos = await Promise.all(newFiles.map(async (file) => ({ type: "new", file, src: await fileToDataUrl(file) })));
  editPhotoDraftsByItem[entry.id] = [...draft, ...newDraftPhotos];
  input.value = "";
  updateEditPhotoPreview(editForm, entry);
});

els.outfitDetailContent.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-detail='outfit']")) els.outfitDetailDialog.close();
  const addButton = event.target.closest("[data-open-outfit-piece-picker]");
  if (addButton) openOutfitPiecePicker(addButton.dataset.openOutfitPiecePicker);
  if (event.target.closest("[data-toggle-outfit-edit]")) {
    els.outfitDetailContent.querySelector("[data-outfit-edit]")?.classList.toggle("is-hidden");
  }
  const tagButton = event.target.closest("[data-remove-outfit-tag]");
  if (tagButton) {
    const outfit = state.outfits.find((entry) => entry.id === tagButton.dataset.removeOutfitTag);
    if (!outfit) return;
    outfit.tags = (outfit.tags || []).filter((tag) => tag !== tagButton.dataset.tag);
    saveState();
    renderOutfits();
    openOutfitDetail(outfit.id);
  }
  const deleteButton = event.target.closest("[data-delete-outfit]");
  if (deleteButton) deleteOutfit(deleteButton.dataset.deleteOutfit);
});

els.closeOutfitPieceDialog.addEventListener("click", () => els.outfitPieceDialog.close());

[els.outfitPieceSearch, els.outfitPieceCategory, els.outfitPieceLocation, els.outfitPieceTag].forEach((input) =>
  input.addEventListener("input", renderOutfitPiecePicker),
);

els.outfitPieceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const outfit = state.outfits.find((entry) => entry.id === activeOutfitPickerId);
  const itemIds = new FormData(els.outfitPieceForm).getAll("itemIds");
  if (!outfit || !itemIds.length) return;
  outfit.itemIds = unique([...outfit.itemIds, ...itemIds]);
  saveState();
  renderOutfits();
  openOutfitDetail(outfit.id);
  els.outfitPieceDialog.close();
});

els.itemDetailContent.addEventListener("submit", async (event) => {
  const editForm = event.target.closest("[data-item-edit]");
  if (editForm) {
    event.preventDefault();
    const entry = getItem(editForm.dataset.itemEdit);
    const form = new FormData(editForm);
    if (!entry) return;
    const editPhotoError = editForm.querySelector("[data-edit-photo-error]");
    if (editPhotoError) editPhotoError.textContent = "";
    const photoDraft = editPhotoDraftFor(entry);
    if (photoDraft.length > 3) {
      if (editPhotoError) editPhotoError.textContent = "Please remove a photo before uploading another, limit is 3.";
      return;
    }
    entry.name = form.get("name").trim();
    entry.brand = form.get("brand").trim();
    entry.category = form.get("category").trim();
    entry.type = form.get("type").trim();
    entry.material = form.get("material").trim();
    entry.locations = listFromText(form.get("locations"));
    entry.location = entry.locations[0] || "";
    entry.tags = tagsFromText(form.get("tags"));
    const finalImages = [];
    for (const [index, photo] of photoDraft.entries()) {
      if (photo.type === "existing") {
        finalImages.push(photo.src);
      } else {
        finalImages.push(await uploadItemPhoto(photo.file, `${entry.id}-edit-${index + 1}`));
      }
    }
    entry.images = finalImages.filter(Boolean).slice(0, 3);
    entry.image = primaryImageFrom(entry.images);
    editPhotoDraftsByItem[entry.id] = null;
    itemDetailImageIndexes[entry.id] = 0;
    state.selectedLocation = entry.locations[0] || "";
    saveState();
    renderAll();
    openItemDetail(entry.id);
    return;
  }

  const form = event.target.closest("[data-detail-outfit-add]");
  if (!form) return;
  event.preventDefault();
  const outfit = state.outfits.find((entry) => entry.id === new FormData(form).get("outfitId"));
  const itemId = form.dataset.detailOutfitAdd;
  if (!outfit || outfit.itemIds.includes(itemId)) return;
  outfit.itemIds.push(itemId);
  saveState();
  renderCloset();
  renderOutfits();
  openItemDetail(itemId);
});

els.outfitDetailContent.addEventListener("submit", (event) => {
  const editForm = event.target.closest("[data-outfit-edit]");
  if (!editForm) return;
  event.preventDefault();
  const outfit = state.outfits.find((entry) => entry.id === editForm.dataset.outfitEdit);
  const form = new FormData(editForm);
  if (!outfit) return;
  const newTag = form.get("newTag").trim().toLowerCase();
  outfit.tags = unique([...(outfit.tags || []), ...(newTag ? [newTag] : [])]);
  outfit.notes = form.get("notes").trim();
  saveState();
  renderOutfits();
  openOutfitDetail(outfit.id);
});

els.outfitGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-outfit-card]");
  if (!card) return;
  openOutfitDetail(card.dataset.outfitCard);
});

els.outfitGrid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest("[data-outfit-card]");
  if (!card) return;
  event.preventDefault();
  openOutfitDetail(card.dataset.outfitCard);
});

els.boardGrid.addEventListener("click", async (event) => {
  if (isGuest()) return;
  const card = event.target.closest("[data-board-card]");
  if (!card) return;
  renderBoardDetail(card.dataset.boardCard);
});

els.boardGrid.addEventListener("keydown", (event) => {
  if (isGuest()) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest("[data-board-card]");
  if (!card) return;
  event.preventDefault();
  renderBoardDetail(card.dataset.boardCard);
});

els.boardDetailView.addEventListener("click", async (event) => {
  if (event.target.closest("[data-board-back]")) {
    activeBoardDetailId = "";
    renderBoards();
    return;
  }

  const addButton = event.target.closest("[data-open-board-picker]");
  if (addButton) {
    if (!isMaster()) return;
    openBoardPicker(addButton.dataset.openBoardPicker);
    return;
  }

  const deleteBoardButton = event.target.closest("[data-delete-board]");
  if (deleteBoardButton) {
    if (!isMaster()) return;
    deleteBoard(deleteBoardButton.dataset.deleteBoard);
    return;
  }

  const removeButton = event.target.closest("[data-remove-board-item]");
  if (removeButton) {
    if (!isMaster()) return;
    const board = state.boards.find((entry) => entry.id === removeButton.dataset.removeBoardItem);
    if (!board) return;
    board.itemIds = board.itemIds.filter((id) => id !== removeButton.dataset.item);
    saveState();
    renderBoardDetail(board.id);
    return;
  }

  const removeOutfitButton = event.target.closest("[data-remove-board-outfit]");
  if (removeOutfitButton) {
    if (!isMaster()) return;
    const board = state.boards.find((entry) => entry.id === removeOutfitButton.dataset.removeBoardOutfit);
    if (!board) return;
    board.outfitIds = (board.outfitIds || []).filter((id) => id !== removeOutfitButton.dataset.outfit);
    saveState();
    renderBoardDetail(board.id);
    return;
  }

  const outfitCard = event.target.closest("[data-outfit-card]");
  if (outfitCard) {
    openOutfitDetail(outfitCard.dataset.outfitCard);
    return;
  }

  const button = event.target.closest("[data-share-board]");
  if (!button) return;
  const url = shareUrl(button.dataset.shareBoard);
  try {
    await navigator.clipboard.writeText(url);
    button.textContent = "Copied";
  } catch {
    window.prompt("Board link", url);
  }
});

els.closeBoardPickerDialog.addEventListener("click", () => els.boardPickerDialog.close());
els.boardPickerSearch.addEventListener("input", renderBoardPicker);

els.boardPickerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const board = state.boards.find((entry) => entry.id === activeBoardPickerId);
  if (!board) return;
  const form = new FormData(els.boardPickerForm);
  board.itemIds = unique([...(board.itemIds || []), ...form.getAll("itemIds")]);
  board.outfitIds = unique([...(board.outfitIds || []), ...form.getAll("outfitIds")]);
  saveState();
  renderBoardDetail(board.id);
  els.boardPickerDialog.close();
});

els.itemForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.itemFormError.textContent = "";
  try {
    const form = new FormData(els.itemForm);
    const name = form.get("name").trim();
    const colors = form.getAll("colors");
    const category = form.get("category").trim();
    const type = form.get("type").trim();
    const locations = listFromText(form.get("location"));
    if (!category) throw new Error("Choose a category.");
    if (!type) throw new Error("Choose a type.");
    if (!locations.length) throw new Error("Add at least one location.");
    const id = `${slug(name)}-${Date.now().toString(36)}`;
    const photos = await uploadItemPhotos(selectedPhotoFiles, id);
    const entry = {
      id,
      name,
      brand: form.get("brand").trim(),
      category,
      type,
      material: form.get("material").trim(),
      colors: colors.length ? colors : [colorValueFromName("Gray")],
      locations,
      location: locations[0] || "",
      tags: tagsFromText(form.get("tags")),
      images: photos,
      image: primaryImageFrom(photos),
    };
    revealOptionValue("category", category);
    revealOptionValue("type", type);
    locations.forEach((location) => revealOptionValue("location", location));
    state.items.unshift(entry);
    state.selectedLocation = entry.location;
    saveState();
    els.itemForm.reset();
    selectedPhotoFiles = [];
    await renderPhotoPreviews();
    updateSelectedColorNames();
    els.itemDialog.close();
    renderAll();
  } catch (error) {
    els.itemFormError.textContent = error.message || "Could not add item.";
  }
});

els.outfitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(els.outfitForm);
  const itemIds = form.getAll("outfitItems");
  if (!itemIds.length) return;
  state.outfits.unshift({
    id: `${slug(form.get("name"))}-${Date.now().toString(36)}`,
    name: form.get("name").trim(),
    occasion: "",
    tags: tagsFromText(form.get("tags")),
    notes: form.get("notes").trim(),
    itemIds,
  });
  saveState();
  els.outfitForm.reset();
  renderOutfits();
});

els.boardForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(els.boardForm);
  state.boards.unshift({
    id: `${slug(form.get("name"))}-${Date.now().toString(36)}`,
    name: form.get("name").trim(),
    notes: form.get("notes").trim(),
    itemIds: [],
  });
  saveState();
  els.boardForm.reset();
  activeBoardDetailId = state.boards[0].id;
  renderBoards();
  renderStats();
});

window.addEventListener("hashchange", () => {
  if (isBoardHash() && !currentRole) currentRole = "public";
  syncPermissions();
  handleHash();
});

initializeSupabaseAccess();
