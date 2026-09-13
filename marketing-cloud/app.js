const templates = [
  { title: "Festival offer", subject: "A little sparkle for the season ✨", body: "Hello {{customerName}},\n\nCelebrate in style with a special Savitri Livings offer. Discover jewellery and gifts made for your moments.\n\nShop now → {{shopUrl}}" },
  { title: "New collection", subject: "A new Savitri Livings collection is here", body: "Hello {{customerName}},\n\nOur newest collection has arrived—thoughtfully selected for gifting, celebrating and everyday elegance.\n\nExplore the collection → {{shopUrl}}" },
  { title: "Special offer", subject: "Something special, just for you", body: "Hello {{customerName}},\n\nWe have a little something special for you. Browse Savitri Livings and find a piece worth remembering.\n\nShop now → {{shopUrl}}" }
];

let customers = [
  { id: "demo-1", fullName: "Priya Sharma", email: "priya@example.com" },
  { id: "demo-2", fullName: "Rahul Kumar", email: "rahul@example.com" },
  { id: "demo-3", fullName: "Amit Singh", email: "amit@example.com" }
];
let selected = new Set();
let activeTemplate = templates[0];
let creativeDownloads = 0;

const $ = selector => document.querySelector(selector);
const toast = message => { const el=$("#toast"); el.textContent=message; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),3800); };
const go = page => { document.querySelectorAll(".page").forEach(el=>el.classList.toggle("active",el.id===page)); document.querySelectorAll(".nav-link").forEach(el=>el.classList.toggle("active",el.dataset.page===page)); window.scrollTo({top:0,behavior:"smooth"}); };

function renderCustomers(){
  $("#customer-list").innerHTML=customers.map(customer=>`<label><input type="checkbox" value="${customer.id}" ${selected.has(customer.id)?"checked":""}><span><b>${customer.fullName}</b><small>${customer.email||"No email saved"}</small></span></label>`).join("");
  $("#selected-count").textContent=`${selected.size} selected`;
  document.querySelectorAll("#customer-list input").forEach(input=>input.addEventListener("change",()=>{input.checked?selected.add(input.value):selected.delete(input.value);renderCustomers();renderTemplate();}));
}

function renderTemplate(){
  $("#email-templates").innerHTML=templates.map((template,index)=>`<button class="template ${template===activeTemplate?"active":""}" data-index="${index}"><b>${template.title}</b><small>${template.subject}</small></button>`).join("");
  document.querySelectorAll(".template").forEach(button=>button.addEventListener("click",()=>{activeTemplate=templates[button.dataset.index];renderTemplate();}));
  const first=customers.find(c=>selected.has(c.id))||{fullName:"Customer"};
  $("#email-subject").textContent=activeTemplate.subject;
  $("#email-body").textContent=activeTemplate.body.replace("{{customerName}}",first.fullName).replace("{{shopUrl}}","your-shop-link");
}

function downloadCreative(){
  const format=$("#creative-format").value;
  const size=format==="story"?[1080,1920]:format==="banner"?[1920,1080]:[1080,1080];
  const canvas=document.createElement("canvas"); [canvas.width,canvas.height]=size; const ctx=canvas.getContext("2d"); const [w,h]=size;
  ctx.fillStyle="#fbf5ea";ctx.fillRect(0,0,w,h);ctx.fillStyle="#9d6a27";ctx.font=`bold ${Math.round(w*.045)}px Georgia`;ctx.textAlign="center";ctx.fillText("SAVITRI LIVINGS",w/2,h*.11);
  ctx.fillStyle="#3e2a15";ctx.font=`bold ${Math.round(w*.08)}px Georgia`;const offer=$("#creative-text").value||"Something special, just for you";ctx.fillText(offer,w/2,h*.23);
  ctx.strokeStyle="#c49a5a";ctx.lineWidth=Math.max(3,w*.003);ctx.strokeRect(w*.1,h*.32,w*.8,h*.4);ctx.fillStyle="#ead3a9";ctx.fillRect(w*.12,h*.34,w*.76,h*.36);
  ctx.fillStyle="#68451f";ctx.font=`bold ${Math.round(w*.034)}px sans-serif`;ctx.fillText($("#creative-theme").value.toUpperCase(),w/2,h*.56);ctx.font=`${Math.round(w*.026)}px sans-serif`;ctx.fillText("Handmade jewellery & home décor",w/2,h*.62);
  ctx.fillStyle="#9d6a27";ctx.font=`bold ${Math.round(w*.03)}px sans-serif`;ctx.fillText("SHOP NOW",w/2,h*.86);
  const link=document.createElement("a");link.download="savitri-livings-creative.png";link.href=canvas.toDataURL("image/png");link.click();creativeDownloads++;$("#creative-count").textContent=creativeDownloads;toast("Creative downloaded.");
}

document.querySelectorAll("[data-page]").forEach(button=>button.addEventListener("click",event=>{event.preventDefault();go(button.dataset.page);}));
document.querySelectorAll("[data-go]").forEach(button=>button.addEventListener("click",()=>go(button.dataset.go)));
$("#add-customer").addEventListener("click",()=>{const name=prompt("Customer name");const email=prompt("Customer email");if(name&&email){customers.push({id:crypto.randomUUID(),fullName:name,email});renderCustomers();toast("Customer added to the audience.");}});
$("#fetch-customers").addEventListener("click",()=>toast("Connect this page to the Savitri Livings backend API when you add authentication. Demo customers are shown for now."));
$("#save-audience").addEventListener("click",()=>{const name=$("#audience-name").value.trim();toast(name?`“${name}” saved for this session.`:"Enter an audience name first.");});
$("#copy-email").addEventListener("click",()=>navigator.clipboard.writeText($("#email-body").textContent).then(()=>toast("Email content copied.")));
$("#send-email").addEventListener("click",()=>toast("Email delivery is intentionally disabled until you connect approved SMTP credentials in the backend."));
$("#creative-text").addEventListener("input",event=>$("#creative-heading").innerHTML=event.target.value.replace(/,/g,",<br>"));
$("#creative-theme").addEventListener("change",event=>$("#creative-theme-label").textContent=event.target.value.toUpperCase());
$("#download-creative").addEventListener("click",downloadCreative);
$("#copy-caption").addEventListener("click",()=>navigator.clipboard.writeText($("#caption").value).then(()=>toast("Caption copied.")));
$("#save-caption").addEventListener("click",()=>toast("Caption saved for this browser session."));
renderCustomers();renderTemplate();
