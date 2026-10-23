const qs = new URLSearchParams(window.location.search);
const apiOverride = qs.get("api") || localStorage.getItem("vikash_api_base");
const localPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname) && ["8080", "5500"].includes(window.location.port);
const defaultApi = window.location.protocol === "file:"
    ? "http://127.0.0.1:8016"
    : localPreview
        ? `${window.location.protocol}//${window.location.hostname}:8016`
        : window.location.origin;
const API = (apiOverride || defaultApi).replace(/\/$/, "");

let token = localStorage.getItem("admin_token");
let currentUser = null;
let isSuperAdmin = false;
let activeTab = "dashboard";

const ORDER_STATUSES = [
    "pending",
    "processing",
    "confirmed",
    "fabricating",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
];

function byId(id) {
    return document.getElementById(id);
}

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function setMessage(elementId, message, type = "info") {
    const el = byId(elementId);
    if (!el) {
        return;
    }
    el.textContent = message || "";
    if (type === "error") {
        el.style.color = "#ff5d8e";
    } else if (type === "success") {
        el.style.color = "#00ff9d";
    } else {
        el.style.color = "#8892b0";
    }
}

async function checkBackend() {
    try {
        const res = await fetch(`${API}/health`);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        setMessage("backend-msg", `API online at ${API}`, "success");
    } catch (_err) {
        setMessage(
            "backend-msg",
            `Backend not reachable at ${API}. Start server: python server.py --host 127.0.0.1 --port 8016`,
            "error",
        );
    }
}

function setAuthVisibility(showAuth) {
    const auth = byId("auth-screen");
    if (!auth) {
        return;
    }
    auth.classList.toggle("hidden", !showAuth);
}

function updateRoleUI() {
    byId("admin-clearance").textContent = `Level ${currentUser?.clearance_level ?? "Unknown"}`;
    const adminsTab = byId("admins-tab-link");
    if (adminsTab) {
        adminsTab.classList.toggle("hidden", !isSuperAdmin);
    }
}

function activateTab(tabName) {
    activeTab = tabName;
    document.querySelectorAll(".view").forEach((view) => view.classList.add("hidden"));
    document.querySelectorAll(".nav-item[data-tab]").forEach((item) => item.classList.remove("active"));

    const tabView = byId(`view-${tabName}`);
    if (tabView) {
        tabView.classList.remove("hidden");
    }

    const tabLink = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (tabLink) {
        tabLink.classList.add("active");
    }

    loadTabData(tabName);
}

function formatMoney(amount) {
    const n = Number(amount || 0);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

async function apiRequest(endpoint, method = "GET", body = null, authRequired = true) {
    const headers = {};
    if (authRequired) {
        headers.Authorization = `Bearer ${token}`;
    }
    if (body !== null) {
        headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API}${endpoint}`, {
        method,
        headers,
        body: body !== null ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const detail = data.detail || data.message || `Request failed (${res.status})`;
        throw new Error(detail);
    }
    return data;
}

async function login() {
    setMessage("error-msg", "");

    const identifier = byId("admin-user").value.trim();
    const password = byId("admin-pass").value;
    if (!identifier || !password) {
        setMessage("error-msg", "Enter both username/email and password", "error");
        return;
    }

    const loginBtn = byId("login-btn");
    loginBtn.disabled = true;
    loginBtn.textContent = "AUTHENTICATING...";

    try {
        const data = await apiRequest(
            "/api/auth/login",
            "POST",
            { identifier, password },
            false,
        );

        if (!data.success || !data.access_token || !data.user) {
            throw new Error("Login failed");
        }
        if ((data.user.clearance_level || 0) < 5) {
            throw new Error("Admin clearance required");
        }

        token = data.access_token;
        localStorage.setItem("admin_token", token);
        currentUser = data.user;
        isSuperAdmin = (currentUser.clearance_level || 0) >= 10;
        updateRoleUI();
        setAuthVisibility(false);
        activateTab("dashboard");
    } catch (err) {
        setMessage("error-msg", err.message || "Login failed", "error");
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "AUTHENTICATE";
    }
}

async function restoreSession() {
    if (!token) {
        setAuthVisibility(true);
        return;
    }

    try {
        const profile = await apiRequest("/api/auth/profile");
        if (!profile.success || !profile.user) {
            throw new Error("Session invalid");
        }
        if ((profile.user.clearance_level || 0) < 5) {
            throw new Error("Admin clearance required");
        }
        currentUser = profile.user;
        isSuperAdmin = (currentUser.clearance_level || 0) >= 10;
        updateRoleUI();
        setAuthVisibility(false);
        activateTab("dashboard");
    } catch (_err) {
        logout();
    }
}

function logout() {
    token = null;
    currentUser = null;
    isSuperAdmin = false;
    localStorage.removeItem("admin_token");
    setAuthVisibility(true);
    byId("admin-pass").value = "";
    setMessage("error-msg", "");
}

function productCategoryBadge(category) {
    return `<span class="badge bg-green">${escapeHtml(category)}</span>`;
}

async function loadStats() {
    try {
        const statsData = await apiRequest("/api/admin/dashboard/stats");
        const controlData = await apiRequest("/api/admin/control/overview");
        const stats = statsData.stats || {};
        const overview = controlData.overview || {};
        const settings = overview.settings || {};

        byId("stats-container").innerHTML = `
            <div class="stat-card">
                <div class="stat-label">TODAY'S REVENUE</div>
                <div class="stat-val">$${formatMoney(stats.revenue_today)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">TOTAL ORDERS</div>
                <div class="stat-val">${escapeHtml(stats.total_orders ?? 0)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">ACTIVE USERS</div>
                <div class="stat-val">${escapeHtml(stats.active_users ?? 0)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">STORE STATUS</div>
                <div class="stat-val">${settings.store?.enabled ? "ON" : "OFF"}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">CHECKOUT</div>
                <div class="stat-val">${settings.store?.allow_checkout ? "ON" : "OFF"}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">WEBPAGE STATUS</div>
                <div class="stat-val">${settings.webpage?.enabled ? "ON" : "OFF"}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">ADMIN COUNT</div>
                <div class="stat-val">${escapeHtml(overview.admin_count ?? 0)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">SUPER ADMINS</div>
                <div class="stat-val">${escapeHtml(overview.super_admin_count ?? 0)}</div>
            </div>
        `;
    } catch (err) {
        byId("stats-container").innerHTML = `<div class="stat-card"><div class="stat-label">${escapeHtml(err.message)}</div></div>`;
    }
}

async function loadRecentOrders() {
    try {
        const data = await apiRequest("/api/admin/orders?limit=5");
        const rows = (data.orders || [])
            .map((order) => `
                <tr>
                    <td>${escapeHtml(order.order_number)}</td>
                    <td>${escapeHtml(order.user_email || "unknown")}</td>
                    <td>$${formatMoney(order.total)}</td>
                    <td>${escapeHtml(order.status)}</td>
                </tr>
            `)
            .join("");

        byId("recent-table").querySelector("tbody").innerHTML = rows || "<tr><td colspan='4'>No recent orders</td></tr>";
    } catch (err) {
        byId("recent-table").querySelector("tbody").innerHTML = `<tr><td colspan="4">${escapeHtml(err.message)}</td></tr>`;
    }
}

async function loadProducts() {
    try {
        const data = await apiRequest("/api/admin/products?limit=500");
        const tbody = byId("products-table");
        tbody.innerHTML = (data.products || [])
            .map((product) => `
                <tr>
                    <td><code>${escapeHtml(product.id)}</code></td>
                    <td>${escapeHtml(product.name)}</td>
                    <td>${productCategoryBadge(product.category)}</td>
                    <td>${formatMoney(product.price)}</td>
                    <td>${escapeHtml(product.stock ?? 0)}</td>
                    <td>${escapeHtml(product.status || "unknown")}</td>
                    <td>
                        <button class="btn btn-sm btn-primary product-edit-btn" data-product-id="${escapeHtml(product.id)}">EDIT</button>
                        <button class="btn btn-sm btn-danger product-delete-btn" data-product-id="${escapeHtml(product.id)}">DEL</button>
                    </td>
                </tr>
            `)
            .join("");

        tbody.querySelectorAll(".product-edit-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                await editProduct(btn.dataset.productId);
            });
        });

        tbody.querySelectorAll(".product-delete-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                await deleteProduct(btn.dataset.productId);
            });
        });
    } catch (err) {
        byId("products-table").innerHTML = `<tr><td colspan="7">${escapeHtml(err.message)}</td></tr>`;
    }
}

async function deleteProduct(productId) {
    if (!productId) {
        return;
    }
    if (!confirm(`Delete/discontinue product ${productId}?`)) {
        return;
    }

    try {
        await apiRequest(`/api/admin/products/${encodeURIComponent(productId)}`, "DELETE");
        await loadProducts();
    } catch (err) {
        alert(err.message || "Delete failed");
    }
}

async function addProductQuick() {
    const name = prompt("Product Name:");
    if (!name) {
        return;
    }

    const category = prompt(
        "Category (microcontrollers, sbc, sensors, iot, rf, tools, services, restricted):",
        "microcontrollers",
    );
    if (!category) {
        return;
    }

    const price = parseFloat(prompt("Price:", "0") || "0");
    const stock = parseInt(prompt("Stock:", "0") || "0", 10);
    const description = prompt("Description:", "") || "";
    const imageUrl = prompt("Image URL:", "") || "";

    const payload = {
        name,
        category,
        price: Number.isFinite(price) ? price : 0,
        stock: Number.isFinite(stock) ? stock : 0,
        description,
        image_url: imageUrl,
        status: "in_stock",
        requires_clearance: category === "restricted",
        features: [],
        specifications: {},
        is_featured: false,
        sort_order: 999,
    };

    try {
        await apiRequest("/api/admin/products", "POST", payload);
        await loadProducts();
    } catch (err) {
        alert(err.message || "Create failed");
    }
}

async function editProduct(productId) {
    // Fetch current product data
    let product;
    try {
        const data = await apiRequest("/api/admin/products?limit=500");
        product = (data.products || []).find(p => p.id === productId);
        if (!product) {
            alert("Product not found");
            return;
        }
    } catch (err) {
        alert("Failed to load product: " + err.message);
        return;
    }

    // Build edit form
    const categories = ["electronics", "furniture", "clothing", "books", "toys", "food", "sports", "automotive", "health", "garden", "jewelry", "art", "music", "tools", "other"];
    const statuses = ["draft", "in_stock", "limited", "fabricating", "preorder", "out_of_stock", "discontinued", "restricted"];

    const formHtml = `
        <div id="product-edit-form" style="max-height: 70vh; overflow-y: auto; padding: 10px;">
            <h3>Edit Product: ${escapeHtml(product.name)}</h3>
            <form id="edit-product-form">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label>Name:</label>
                        <input type="text" id="edit-name" value="${escapeHtml(product.name || '')}" style="width: 100%;" required>
                    </div>
                    <div>
                        <label>Category:</label>
                        <select id="edit-category" style="width: 100%;">
                            ${categories.map(c => `<option value="${c}" ${c === product.category ? 'selected' : ''}>${c}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label>Price ($):</label>
                        <input type="number" id="edit-price" value="${product.price}" step="0.01" min="0" style="width: 100%;">
                    </div>
                    <div>
                        <label>Stock:</label>
                        <input type="number" id="edit-stock" value="${product.stock}" min="0" style="width: 100%;">
                    </div>
                    <div>
                        <label>Status:</label>
                        <select id="edit-status" style="width: 100%;">
                            ${statuses.map(s => `<option value="${s}" ${s === product.status ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label>Sort Order:</label>
                        <input type="number" id="edit-sort-order" value="${product.sort_order || 999}" min="0" style="width: 100%;">
                    </div>
                    <div>
                        <label>Image URL:</label>
                        <input type="text" id="edit-image-url" value="${escapeHtml(product.image_url || '')}" style="width: 100%;">
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" id="edit-featured" ${product.is_featured ? 'checked' : ''}>
                        <label>Featured Product</label>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" id="edit-clearance" ${product.requires_clearance ? 'checked' : ''}>
                        <label>Requires Clearance</label>
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <label>Description:</label>
                    <textarea id="edit-description" rows="4" style="width: 100%;">${escapeHtml(product.description || '')}</textarea>
                </div>
                <div style="margin-top: 10px;">
                    <label>Detailed Description:</label>
                    <textarea id="edit-detailed-description" rows="6" style="width: 100%;">${escapeHtml(product.detailed_description || '')}</textarea>
                </div>
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;

    showModal(formHtml);

    // Handle form submission
    document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            name: document.getElementById('edit-name').value,
            category: document.getElementById('edit-category').value,
            price: parseFloat(document.getElementById('edit-price').value) || 0,
            stock: parseInt(document.getElementById('edit-stock').value) || 0,
            status: document.getElementById('edit-status').value,
            sort_order: parseInt(document.getElementById('edit-sort-order').value) || 999,
            image_url: document.getElementById('edit-image-url').value,
            description: document.getElementById('edit-description').value,
            detailed_description: document.getElementById('edit-detailed-description').value,
            is_featured: document.getElementById('edit-featured').checked,
            requires_clearance: document.getElementById('edit-clearance').checked
        };

        try {
            await apiRequest(`/api/admin/products/${encodeURIComponent(productId)}`, "PUT", payload);
            closeModal();
            await loadProducts();
            alert("Product updated successfully!");
        } catch (err) {
            alert(err.message || "Update failed");
        }
    });
}

function orderStatusSelect(orderId, currentStatus) {
    const options = ORDER_STATUSES.map((statusVal) => {
        const selected = statusVal === currentStatus ? "selected" : "";
        return `<option value="${statusVal}" ${selected}>${statusVal}</option>`;
    }).join("");
    return `
        <div style="display:flex; gap:8px; align-items:center;">
            <select class="order-status-select" data-order-id="${orderId}">
                ${options}
            </select>
            <button class="btn btn-sm btn-primary order-status-save-btn" data-order-id="${orderId}">SAVE</button>
        </div>
    `;
}

async function loadOrders() {
    try {
        const data = await apiRequest("/api/admin/orders?limit=500");
        const tbody = byId("orders-table");
        tbody.innerHTML = (data.orders || [])
            .map((order) => `
                <tr>
                    <td>${escapeHtml(order.order_number)}</td>
                    <td>${escapeHtml(order.user_email || "unknown")}</td>
                    <td>${escapeHtml(order.total_items || 0)} items</td>
                    <td>$${formatMoney(order.total)}</td>
                    <td>${orderStatusSelect(order.id, order.status)}</td>
                </tr>
            `)
            .join("");

        tbody.querySelectorAll(".order-status-save-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const orderId = btn.dataset.orderId;
                const select = tbody.querySelector(`.order-status-select[data-order-id="${orderId}"]`);
                const nextStatus = select ? select.value : null;
                if (!orderId || !nextStatus) {
                    return;
                }
                await updateOrderStatus(orderId, nextStatus);
            });
        });
    } catch (err) {
        byId("orders-table").innerHTML = `<tr><td colspan="5">${escapeHtml(err.message)}</td></tr>`;
    }
}

async function updateOrderStatus(orderId, nextStatus) {
    try {
        await apiRequest(`/api/admin/orders/${orderId}/status`, "PUT", { status: nextStatus });
        await loadOrders();
        if (activeTab === "dashboard") {
            await loadRecentOrders();
        }
    } catch (err) {
        alert(err.message || "Order update failed");
    }
}

async function loadUsers() {
    try {
        const data = await apiRequest("/api/admin/users?limit=500");
        byId("users-table").innerHTML = (data.users || [])
            .map((user) => {
                const statusText = user.is_active ? "ACTIVE" : "INACTIVE";
                const statusClass = user.is_active ? "bg-green" : "bg-red";
                return `
                    <tr>
                        <td>${escapeHtml(user.name)}</td>
                        <td>${escapeHtml(user.email)}</td>
                        <td>${escapeHtml(user.username)}</td>
                        <td>Level ${escapeHtml(user.clearance_level)}</td>
                        <td><span class="badge ${statusClass}">${statusText}</span></td>
                        <td>$${formatMoney(user.balance)}</td>
                    </tr>
                `;
            })
            .join("");
    } catch (err) {
        byId("users-table").innerHTML = `<tr><td colspan="6">${escapeHtml(err.message)}</td></tr>`;
    }
}

function fillControls(settings) {
    byId("webpage-enabled").checked = !!settings.webpage?.enabled;
    byId("webpage-message").value = settings.webpage?.maintenance_message || "";

    byId("store-enabled").checked = !!settings.store?.enabled;
    byId("store-checkout-enabled").checked = !!settings.store?.allow_checkout;
    byId("store-custom-enabled").checked = !!settings.store?.allow_custom_requests;
    byId("store-message").value = settings.store?.maintenance_message || "";
}

async function loadControls() {
    try {
        const data = await apiRequest("/api/admin/control/settings");
        const settings = data.settings || {};
        fillControls(settings);

        const updatedAt = settings.updated_at ? new Date(settings.updated_at).toLocaleString() : "Never";
        const updatedBy = settings.updated_by || "N/A";
        setMessage("controls-status", `Last updated: ${updatedAt} by ${updatedBy}`);
    } catch (err) {
        setMessage("controls-status", err.message || "Failed to load controls", "error");
    }
}

async function saveControls(event) {
    event.preventDefault();
    const payload = {
        webpage: {
            enabled: byId("webpage-enabled").checked,
            maintenance_message: byId("webpage-message").value.trim(),
        },
        store: {
            enabled: byId("store-enabled").checked,
            allow_checkout: byId("store-checkout-enabled").checked,
            allow_custom_requests: byId("store-custom-enabled").checked,
            maintenance_message: byId("store-message").value.trim(),
        },
    };

    try {
        await apiRequest("/api/admin/control/settings", "PUT", payload);
        setMessage("controls-status", "Runtime settings updated", "success");
        await loadStats();
    } catch (err) {
        setMessage("controls-status", err.message || "Failed to save controls", "error");
    }
}

function adminClearanceSelect(admin) {
    const level = Number(admin.clearance_level || 5);
    return `
        <select data-admin-clearance="${escapeHtml(admin.id)}">
            <option value="5" ${level === 5 ? "selected" : ""}>5</option>
            <option value="10" ${level >= 10 ? "selected" : ""}>10</option>
        </select>
    `;
}

function adminActiveSelect(admin) {
    const active = !!admin.is_active;
    return `
        <select data-admin-active="${escapeHtml(admin.id)}">
            <option value="true" ${active ? "selected" : ""}>true</option>
            <option value="false" ${!active ? "selected" : ""}>false</option>
        </select>
    `;
}

async function loadAdmins() {
    if (!isSuperAdmin) {
        setMessage("admins-status", "Super admin access required", "error");
        byId("admins-table").innerHTML = "<tr><td colspan='6'>Super admin access required</td></tr>";
        return;
    }

    try {
        const data = await apiRequest("/api/admin/control/admins?limit=500");
        const admins = data.admins || [];
        const tbody = byId("admins-table");
        tbody.innerHTML = admins
            .map((admin) => {
                const isSelf = currentUser && currentUser.id === admin.id;
                return `
                    <tr>
                        <td>${escapeHtml(admin.name)}</td>
                        <td>${escapeHtml(admin.username)}</td>
                        <td>${escapeHtml(admin.email)}</td>
                        <td>${adminClearanceSelect(admin)}</td>
                        <td>${adminActiveSelect(admin)}</td>
                        <td>
                            <button class="btn btn-sm btn-primary admin-update-btn" data-admin-id="${escapeHtml(admin.id)}">SAVE</button>
                            <button class="btn btn-sm btn-danger admin-delete-btn" data-admin-id="${escapeHtml(admin.id)}" ${isSelf ? "disabled" : ""}>DEL</button>
                        </td>
                    </tr>
                `;
            })
            .join("");

        tbody.querySelectorAll(".admin-update-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                await updateAdmin(btn.dataset.adminId);
            });
        });

        tbody.querySelectorAll(".admin-delete-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                await deleteAdmin(btn.dataset.adminId);
            });
        });

        setMessage("admins-status", `Loaded ${admins.length} admin users`);
    } catch (err) {
        setMessage("admins-status", err.message || "Failed to load admin users", "error");
        byId("admins-table").innerHTML = `<tr><td colspan="6">${escapeHtml(err.message)}</td></tr>`;
    }
}

async function createAdmin(event) {
    event.preventDefault();
    if (!isSuperAdmin) {
        setMessage("admins-status", "Super admin access required", "error");
        return;
    }

    const payload = {
        name: byId("new-admin-name").value.trim(),
        username: byId("new-admin-username").value.trim(),
        email: byId("new-admin-email").value.trim(),
        password: byId("new-admin-password").value,
        clearance_level: parseInt(byId("new-admin-clearance").value, 10),
    };

    try {
        await apiRequest("/api/admin/control/admins", "POST", payload);
        byId("create-admin-form").reset();
        setMessage("admins-status", "Admin user created successfully", "success");
        await loadAdmins();
        await loadStats();
    } catch (err) {
        setMessage("admins-status", err.message || "Failed to create admin", "error");
    }
}

async function updateAdmin(adminId) {
    if (!adminId) {
        return;
    }
    const clearanceSelect = document.querySelector(`[data-admin-clearance="${adminId}"]`);
    const activeSelect = document.querySelector(`[data-admin-active="${adminId}"]`);

    const payload = {
        clearance_level: parseInt(clearanceSelect?.value || "5", 10),
        is_active: (activeSelect?.value || "true") === "true",
    };

    try {
        await apiRequest(`/api/admin/control/admins/${encodeURIComponent(adminId)}`, "PATCH", payload);
        setMessage("admins-status", "Admin user updated", "success");
        await loadAdmins();
    } catch (err) {
        setMessage("admins-status", err.message || "Failed to update admin", "error");
    }
}

async function deleteAdmin(adminId) {
    if (!adminId) {
        return;
    }
    if (!confirm(`Delete admin account ${adminId}?`)) {
        return;
    }

    try {
        await apiRequest(`/api/admin/control/admins/${encodeURIComponent(adminId)}`, "DELETE");
        setMessage("admins-status", "Admin user deleted", "success");
        await loadAdmins();
        await loadStats();
    } catch (err) {
        setMessage("admins-status", err.message || "Failed to delete admin", "error");
    }
}

async function loadTabData(tabName) {
    if (tabName === "dashboard") {
        await Promise.all([loadStats(), loadRecentOrders()]);
        return;
    }
    if (tabName === "products") {
        await loadProducts();
        return;
    }
    if (tabName === "orders") {
        await loadOrders();
        return;
    }
    if (tabName === "users") {
        await loadUsers();
        return;
    }
    if (tabName === "controls") {
        await loadControls();
        return;
    }
    if (tabName === "admins") {
        await loadAdmins();
    }
}

function bindEvents() {
    byId("login-btn").addEventListener("click", login);
    byId("admin-pass").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            login();
        }
    });

    byId("logout-btn").addEventListener("click", logout);
    byId("refresh-dashboard-btn").addEventListener("click", () => activateTab("dashboard"));
    byId("refresh-orders-btn").addEventListener("click", () => activateTab("orders"));
    byId("refresh-users-btn").addEventListener("click", () => activateTab("users"));
    byId("refresh-controls-btn").addEventListener("click", () => activateTab("controls"));
    byId("refresh-admins-btn").addEventListener("click", () => activateTab("admins"));
    byId("add-product-btn").addEventListener("click", addProductQuick);

    byId("controls-form").addEventListener("submit", saveControls);
    byId("create-admin-form").addEventListener("submit", createAdmin);

    document.querySelectorAll(".nav-item[data-tab]").forEach((item) => {
        item.addEventListener("click", () => {
            const tab = item.dataset.tab;
            if (tab === "admins" && !isSuperAdmin) {
                setMessage("admins-status", "Super admin access required", "error");
                return;
            }
            activateTab(tab);
        });
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    bindEvents();
    await checkBackend();
    await restoreSession();
});
