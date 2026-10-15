import { isSupabaseConfigured, supabase } from "./supabase-client.js";

const status = document.querySelector("#certification-status");
const list = document.querySelector("#certification-list");
const initialCertifications = [
    { title: "Google Skillshop", sort_order: 10 },
    { title: "Claude Academy", sort_order: 20 },
    { title: "HubSpot Academy", sort_order: 30 },
    { title: "Meta Blueprint", sort_order: 40 }
];

function addTextElement(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    element.textContent = text;
    parent.append(element);
    return element;
}

function renderCertification(certification) {
    const card = document.createElement("article");
    card.className = "certification-card";

    addTextElement(card, "h2", "", certification.title);
    if (certification.provider) {
        addTextElement(card, "p", "certification-provider", certification.provider);
    }
    if (certification.status) {
        addTextElement(card, "p", "certification-status-label", certification.status);
    }

    if (certification.completed_on) {
        const date = new Date(`${certification.completed_on}T00:00:00`);
        addTextElement(card, "p", "certification-date", date.toLocaleDateString("no-NO"));
    }
    if (certification.description) {
        addTextElement(card, "p", "certification-description", certification.description);
    }

    if (certification.credential_url) {
        const link = document.createElement("a");
        link.href = certification.credential_url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Se sertifikat";
        card.append(link);
    }

    return card;
}

async function loadCertifications() {
    if (!isSupabaseConfigured || !supabase) {
        list.replaceChildren(...initialCertifications.map(renderCertification));
        status.textContent = "Redigering via admin blir tilgjengelig når Supabase er konfigurert.";
        return;
    }

    const { data, error } = await supabase
        .from("certifications")
        .select("id, title, provider, description, status, completed_on, credential_url, sort_order")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Kunne ikke laste sertifiseringer og kurs:", error);
        status.textContent = "Sertifiseringer og kurs kunne ikke lastes inn.";
        return;
    }

    list.replaceChildren(...data.map(renderCertification));
    status.textContent = data.length === 0 ? "Ingen sertifiseringer eller kurs er lagt til ennå." : "";
}

loadCertifications();
