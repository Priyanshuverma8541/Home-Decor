const SAVITRI_API = window.SAVITRI_API_URL || "https://home-decor-0rfj.onrender.com";

document.querySelector("#year").textContent = new Date().getFullYear();

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-header nav");
menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  navigation.classList.toggle("open", open);
});
navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    navigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
  }
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if ("IntersectionObserver" in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".project-card, .service-grid article, .about-layout, .contact-section").forEach((element) => {
    element.classList.add("reveal");
    revealObserver.observe(element);
  });
}

const enquiryForm = document.querySelector("#enquiry-form");
const enquiryStatus = document.querySelector("#form-status");
enquiryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(enquiryForm);
  const submitButton = enquiryForm.querySelector("button[type=submit]");
  const need = String(formData.get("need") || "Project enquiry").slice(0, 120);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();
  submitButton.disabled = true;
  enquiryStatus.textContent = "Sending your enquiry…";
  try {
    const response = await fetch(`${SAVITRI_API.replace(/\/$/, "")}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        source: "website",
        interestedIn: [need],
        tags: ["priyanshu-portfolio", "project-enquiry"],
        notes: [{ text: `Portfolio enquiry for Priyanshu Verma — ${need}\n\n${message}` }],
        acquisition: { source: "priyanshu-verma-portfolio", medium: "website", campaign: "portfolio-enquiry" },
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "We couldn’t send your enquiry. Please try again.");
    enquiryForm.reset();
    enquiryStatus.textContent = "Thanks — your enquiry has been received. I’ll be in touch.";
    enquiryForm.dataset.state = "success";
  } catch (error) {
    enquiryStatus.textContent = `${error.message} You can also reach me on LinkedIn.`;
    enquiryForm.dataset.state = "error";
  } finally {
    submitButton.disabled = false;
  }
});
