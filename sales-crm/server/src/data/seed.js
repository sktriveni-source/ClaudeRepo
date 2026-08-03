import {
  createLead,
  createAccount,
  createContact,
  createOpportunity,
  changeLeadStatus,
  changeOpportunityStage,
  convertLead,
  logActivity,
} from "../store/db.js";

/** Populates the in-memory store with a realistic starting dataset so the
 * dashboard, pipeline and record lists aren't empty on first load. */
export function seedDemoData() {
  // --- Fresh / nurturing leads --------------------------------------------
  const l1 = createLead({
    firstName: "Meera",
    lastName: "Kulkarni",
    company: "Orbit Retail Group",
    title: "VP Operations",
    email: "meera.kulkarni@orbitretail.example",
    phone: "+1-415-555-0142",
    source: "Web",
    owner: "Priya Sharma",
    rating: "Hot",
    notes: "Downloaded pricing sheet, requested a demo.",
  });

  const l2 = createLead({
    firstName: "Daniel",
    lastName: "Ochieng",
    company: "Northwind Logistics",
    title: "IT Director",
    email: "daniel.o@northwindlog.example",
    phone: "+1-312-555-0110",
    source: "Trade Show",
    owner: "Arjun Mehta",
    rating: "Warm",
    notes: "Met at LogiTech Expo, interested in fleet analytics module.",
  });
  changeLeadStatus(l2.id, "Nurturing", { owner: "Arjun Mehta", note: "Sent follow-up nurture sequence." });

  const l3 = createLead({
    firstName: "Aiko",
    lastName: "Tanaka",
    company: "Sunrise Health Partners",
    title: "COO",
    email: "aiko.tanaka@sunrisehealth.example",
    phone: "+1-206-555-0199",
    source: "Referral",
    owner: "Kavya Rao",
    rating: "Hot",
  });
  changeLeadStatus(l3.id, "Nurturing", { owner: "Kavya Rao", note: "Scheduling discovery call." });

  createLead({
    firstName: "Lucas",
    lastName: "Bergmann",
    company: "Helion Energy Systems",
    title: "Procurement Manager",
    email: "lucas.b@helionenergy.example",
    phone: "+49-30-555-0173",
    source: "Advertisement",
    owner: "Rahul Nair",
    rating: "Cold",
  });

  const l5 = createLead({
    firstName: "Grace",
    lastName: "Whittaker",
    company: "Blue Harbor Financial",
    title: "Head of Digital",
    email: "grace.w@blueharbor.example",
    phone: "+44-20-555-0166",
    source: "Email Campaign",
    owner: "Sneha Iyer",
    rating: "Warm",
  });
  changeLeadStatus(l5.id, "Disqualified", { owner: "Sneha Iyer", note: "Budget frozen for this fiscal year." });

  // --- Converted lead → account/contact/opportunity in early stage --------
  const l6 = createLead({
    firstName: "Sofia",
    lastName: "Ramirez",
    company: "Vertex Manufacturing",
    title: "Plant Manager",
    email: "sofia.ramirez@vertexmfg.example",
    phone: "+1-713-555-0121",
    source: "Cold Call",
    owner: "Priya Sharma",
    rating: "Hot",
  });
  changeLeadStatus(l6.id, "Nurturing", { owner: "Priya Sharma" });
  convertLead(l6.id, {
    owner: "Priya Sharma",
    amount: 48000,
    closeDate: futureDate(45),
    opportunityName: "Vertex Manufacturing – Plant Automation Suite",
  });

  // --- Existing accounts with contacts and opportunities across stages ----
  const accGlobex = createAccount({ name: "Globex Technologies", industry: "Technology", website: "globextech.example", phone: "+1-650-555-0134", billingCity: "San Jose", billingCountry: "USA", owner: "Arjun Mehta" });
  const contactGlobex = createContact({ firstName: "Ethan", lastName: "Park", email: "ethan.park@globextech.example", phone: "+1-650-555-0135", title: "CTO", accountId: accGlobex.id, leadSource: "Referral", owner: "Arjun Mehta" });
  const oppGlobex = createOpportunity({ name: "Globex Technologies – Platform Modernization", accountId: accGlobex.id, contactId: contactGlobex.id, amount: 125000, closeDate: futureDate(30), owner: "Arjun Mehta", stage: "Qualify" });
  changeOpportunityStage(oppGlobex.id, "Proposal", { owner: "Arjun Mehta", note: "Sent proposal deck and pricing." });

  const accSummit = createAccount({ name: "Summit Consulting Group", industry: "Financial Services", website: "summitcg.example", phone: "+1-212-555-0188", billingCity: "New York", billingCountry: "USA", owner: "Kavya Rao" });
  const contactSummit = createContact({ firstName: "Olivia", lastName: "Bennett", email: "olivia.bennett@summitcg.example", phone: "+1-212-555-0189", title: "Managing Partner", accountId: accSummit.id, leadSource: "Web", owner: "Kavya Rao" });
  const oppSummit = createOpportunity({ name: "Summit Consulting – Advisory Analytics Rollout", accountId: accSummit.id, contactId: contactSummit.id, amount: 87000, closeDate: futureDate(20), owner: "Kavya Rao", stage: "Proposal" });
  changeOpportunityStage(oppSummit.id, "Negotiation", { owner: "Kavya Rao", note: "Legal reviewing MSA redlines." });

  const accAurora = createAccount({ name: "Aurora Retail Co.", industry: "Retail", website: "auroraretail.example", phone: "+1-503-555-0177", billingCity: "Portland", billingCountry: "USA", owner: "Rahul Nair" });
  const contactAurora = createContact({ firstName: "Marcus", lastName: "Lee", email: "marcus.lee@auroraretail.example", phone: "+1-503-555-0178", title: "Director of E-Commerce", accountId: accAurora.id, leadSource: "Partner", owner: "Rahul Nair" });
  const oppAurora = createOpportunity({ name: "Aurora Retail – Omnichannel POS Contract", accountId: accAurora.id, contactId: contactAurora.id, amount: 156000, closeDate: futureDate(10), owner: "Rahul Nair", stage: "Negotiation" });
  changeOpportunityStage(oppAurora.id, "Contract", { owner: "Rahul Nair", note: "Signed order form pending countersignature." });

  const accHarbor = createAccount({ name: "Harborview Energy", industry: "Energy", website: "harborviewenergy.example", phone: "+1-617-555-0143", billingCity: "Boston", billingCountry: "USA", owner: "Sneha Iyer" });
  const contactHarbor = createContact({ firstName: "Isabella", lastName: "Cruz", email: "isabella.cruz@harborviewenergy.example", phone: "+1-617-555-0144", title: "VP Engineering", accountId: accHarbor.id, leadSource: "Trade Show", owner: "Sneha Iyer" });
  const oppHarbor = createOpportunity({ name: "Harborview Energy – Grid Monitoring Deployment", accountId: accHarbor.id, contactId: contactHarbor.id, amount: 210000, closeDate: futureDate(5), owner: "Sneha Iyer", stage: "Contract" });
  changeOpportunityStage(oppHarbor.id, "Execute", { owner: "Sneha Iyer", note: "Implementation kickoff scheduled." });

  const accPioneer = createAccount({ name: "Pioneer EdTech", industry: "Education", website: "pioneeredtech.example", phone: "+1-512-555-0122", billingCity: "Austin", billingCountry: "USA", owner: "Priya Sharma" });
  const contactPioneer = createContact({ firstName: "Noah", lastName: "Fischer", email: "noah.fischer@pioneeredtech.example", phone: "+1-512-555-0123", title: "Head of IT", accountId: accPioneer.id, leadSource: "Web", owner: "Priya Sharma" });
  const oppPioneerWon = createOpportunity({ name: "Pioneer EdTech – Campus LMS Integration", accountId: accPioneer.id, contactId: contactPioneer.id, amount: 64000, closeDate: pastDate(4), owner: "Priya Sharma", stage: "Execute" });
  changeOpportunityStage(oppPioneerWon.id, "Closed Won", { owner: "Priya Sharma", note: "Go-live completed successfully." });

  const accTelco = createAccount({ name: "Meridian Telecom", industry: "Telecommunications", website: "meridiantelecom.example", phone: "+1-404-555-0198", billingCity: "Atlanta", billingCountry: "USA", owner: "Arjun Mehta" });
  const contactTelco = createContact({ firstName: "Chloe", lastName: "Dubois", email: "chloe.dubois@meridiantelecom.example", phone: "+1-404-555-0199", title: "Procurement Lead", accountId: accTelco.id, leadSource: "Cold Call", owner: "Arjun Mehta" });
  const oppTelcoLost = createOpportunity({ name: "Meridian Telecom – Network Ops Dashboard", accountId: accTelco.id, contactId: contactTelco.id, amount: 92000, closeDate: pastDate(2), owner: "Arjun Mehta", stage: "Negotiation" });
  changeOpportunityStage(oppTelcoLost.id, "Closed Lost", { owner: "Arjun Mehta", note: "Selected an incumbent vendor." });

  // A couple of open-stage opportunities right at entry
  const accNimbus = createAccount({ name: "Nimbus Cloud Services", industry: "Technology", website: "nimbuscloud.example", phone: "+1-206-555-0155", billingCity: "Seattle", billingCountry: "USA", owner: "Kavya Rao" });
  const contactNimbus = createContact({ firstName: "Liam", lastName: "Foster", email: "liam.foster@nimbuscloud.example", phone: "+1-206-555-0156", title: "VP Sales", accountId: accNimbus.id, leadSource: "Referral", owner: "Kavya Rao" });
  createOpportunity({ name: "Nimbus Cloud – CRM Data Sync", accountId: accNimbus.id, contactId: contactNimbus.id, amount: 39000, closeDate: futureDate(60), owner: "Kavya Rao", stage: "Opportunity" });

  logActivity({ relatedType: "Opportunity", relatedId: oppGlobex.id, type: "Call", subject: "Discovery call with Ethan Park", description: "Discussed integration requirements and timeline.", owner: "Arjun Mehta" });
  logActivity({ relatedType: "Opportunity", relatedId: oppSummit.id, type: "Email", subject: "Sent updated pricing proposal", owner: "Kavya Rao" });
  logActivity({ relatedType: "Lead", relatedId: l1.id, type: "Call", subject: "Intro call with Meera Kulkarni", description: "Positive reception, sending case studies.", owner: "Priya Sharma" });
}

function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function pastDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
