import { isSupabaseConfigured, supabase } from "./supabase-client.js";

const loginForm = document.querySelector("#login-form");
const adminPanel = document.querySelector("#admin-panel");
const message = document.querySelector("#admin-message");
const certificationForm = document.querySelector("#certification-form");
const certificationList = document.querySelector("#admin-certification-list");
const cancelEditButton = document.querySelector("#cancel-edit");
const fields = {
    id: document.querySelector("#certification-id"),
    title: document.querySelector("#certification-title"),
    provider: document.querySelector("#certification-provider"),
    description: document.querySelector("#certification-description"),
    status: document.querySelector("#certification-status"),
    completedOn: document.querySelector("#certification-date"),
    credentialUrl: document.querySelector("#certification-url"),
    sortOrder: document.querySelector("#certification-order"),
    isPublished: document.querySelector("#certification-published")
};

function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("is-error", isError);
}

function setAuthenticated(isAuthenticated) {
    loginForm.hidden = isAuthenticated;
    adminPanel.hidden = !isAuthenticated;
}

function resetForm() {
    certificationForm.reset();
    fields.id.value = "";
    fields.sortOrder.value = "0";
    fields.isPublished.checked = true;
    cancelEditButton.hidden = true;
}

function appendText(parent, tagName, text) {
    const element = document.createElement(tagName);
    element.textContent = text;
    parent.append(element);
    return element;
}

function renderAdminCertification(certification) {
    const item = document.createElement("article");
    item.className = "admin-certification-item";
    item.dataset.id = certification.id;
    appendText(item, "h3", certification.title);
    appendText(
        item,
        "p",
        `${certification.provider || "Uten kursleverandør"} · ${certification.status || "Status ikke angitt"} · ${certification.is_published ? "Offentlig" : "Skjult"}`
    );

    const actions = document.createElement("div");
    actions.className = "admin-item-actions";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.dataset.action = "edit";
    editButton.textContent = "Rediger";
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.textContent = "Slett";
    actions.append(editButton, deleteButton);
    item.append(actions);
    return item;
}

async function loadCertifications() {
    const { data, error } = await supabase
        .from("certifications")
        .select("id, title, provider, description, status, completed_on, credential_url, sort_order, is_published, created_at")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Kunne ikke hente admin-sertifiseringer:", error);
        showMessage("Kunne ikke hente listen. Kontroller Supabase-tilkoblingen.", true);
        return;
    }

    certificationList.replaceChildren(...data.map(renderAdminCertification));
}

async function confirmAdminAccess() {
    const { data, error } = await supabase.rpc("is_admin");
    if (error || data !== true) {
        if (error) {
            console.error("Kunne ikke bekrefte admin-tilgang:", error);
        }
        await supabase.auth.signOut();
        setAuthenticated(false);
        showMessage("Denne brukeren har ikke admin-tilgang.", true);
        return;
    }

    setAuthenticated(true);
    showMessage("");
    await loadCertifications();
}

if (!isSupabaseConfigured || !supabase) {
    loginForm.hidden = true;
    showMessage("Admin er ikke konfigurert ennå. Følg oppsettet i SUPABASE-SETUP.md.", true);
} else {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(loginForm);
        showMessage("Logger inn ...");

        const { error } = await supabase.auth.signInWithPassword({
            email: formData.get("email"),
            password: formData.get("password")
        });

        if (error) {
            console.error("Admin-innlogging feilet:", error);
            showMessage("Innlogging feilet. Kontroller e-post og passord.", true);
            return;
        }
        await confirmAdminAccess();
    });

    supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
            console.error("Kunne ikke hente Supabase-økten:", error);
            showMessage("Kunne ikke kontrollere innloggingen.", true);
            return;
        }
        if (data.session) {
            confirmAdminAccess();
        }
    });

    document.querySelector("#sign-out").addEventListener("click", async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Kunne ikke logge ut:", error);
            showMessage("Utlogging feilet.", true);
            return;
        }
        setAuthenticated(false);
        certificationList.replaceChildren();
        resetForm();
        showMessage("Du er logget ut.");
    });

    certificationForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const certification = {
            title: fields.title.value.trim(),
            provider: fields.provider.value.trim(),
            description: fields.description.value.trim(),
            status: fields.status.value || null,
            completed_on: fields.completedOn.value || null,
            credential_url: fields.credentialUrl.value.trim() || null,
            sort_order: Number.parseInt(fields.sortOrder.value, 10) || 0,
            is_published: fields.isPublished.checked
        };
        const id = fields.id.value;
        const query = id
            ? supabase.from("certifications").update(certification).eq("id", id)
            : supabase.from("certifications").insert(certification);

        showMessage("Lagrer ...");
        const { error } = await query;
        if (error) {
            console.error("Kunne ikke lagre sertifisering:", error);
            showMessage("Kunne ikke lagre. Kontroller tilgang og feltene.", true);
            return;
        }

        resetForm();
        showMessage("Endringene er lagret.");
        await loadCertifications();
    });

    cancelEditButton.addEventListener("click", resetForm);

    certificationList.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }

        const item = button.closest(".admin-certification-item");
        const { data: certification, error: fetchError } = await supabase
            .from("certifications")
            .select("*")
            .eq("id", item.dataset.id)
            .single();

        if (fetchError) {
            console.error("Kunne ikke hente sertifiseringsdetaljer:", fetchError);
            showMessage("Kunne ikke hente elementet.", true);
            return;
        }

        if (button.dataset.action === "edit") {
            if (!certification) {
                showMessage("Fant ikke dette elementet.", true);
                return;
            }
            fields.id.value = certification.id;
            fields.title.value = certification.title;
            fields.provider.value = certification.provider || "";
            fields.description.value = certification.description || "";
            fields.status.value = certification.status;
            fields.completedOn.value = certification.completed_on || "";
            fields.credentialUrl.value = certification.credential_url || "";
            fields.sortOrder.value = String(certification.sort_order);
            fields.isPublished.checked = certification.is_published;
            cancelEditButton.hidden = false;
            fields.title.focus();
            return;
        }

        if (!window.confirm(`Vil du slette «${certification?.title || "dette elementet"}»?`)) {
            return;
        }

        const { error } = await supabase
            .from("certifications")
            .delete()
            .eq("id", item.dataset.id);
        if (error) {
            console.error("Kunne ikke slette sertifisering:", error);
            showMessage("Kunne ikke slette elementet.", true);
            return;
        }
        showMessage("Elementet er slettet.");
        await loadCertifications();
    });
}
