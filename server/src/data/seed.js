import { nextId } from "../utils/ids.js";

// Anchor date the demo data is built around, so "closing this month" /
// "no activity in 30 days" style AI insights stay meaningful regardless of
// when the app is actually run.
export const TODAY = new Date("2026-07-20T00:00:00Z");

function daysAgo(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const salesUsers = [
  { userId: "U-001", name: "John Smith", role: "Account Manager", region: "Europe" },
  { userId: "U-002", name: "Priya Nair", role: "Sales Representative", region: "APAC" },
  { userId: "U-003", name: "Carlos Diaz", role: "Sales Representative", region: "Americas" },
  { userId: "U-004", name: "Emma Wilson", role: "Sales Manager", region: "Europe" },
  { userId: "U-005", name: "Wei Zhang", role: "Sales Representative", region: "APAC" },
  { userId: "U-006", name: "Sarah Johnson", role: "Sales Director", region: "Global" },
];

export const products = [
  { productId: "P-001", productName: "Product X - Network Analytics Suite", category: "Analytics", price: 120000 },
  { productId: "P-002", productName: "Product Y - Customer Engagement Platform", category: "Platform", price: 85000 },
  { productId: "P-003", productName: "Product Z - Cloud Billing Module", category: "Billing", price: 60000 },
  { productId: "P-004", productName: "Managed Support - Premium", category: "Services", price: 30000 },
  { productId: "P-005", productName: "AI Insights Add-on", category: "Analytics", price: 45000 },
  { productId: "P-006", productName: "Integration Connector Pack", category: "Platform", price: 20000 },
];

export const accounts = [
  {
    accountId: "A-001",
    accountName: "ABC Corporation",
    industry: "Telecom",
    country: "Germany",
    region: "Europe",
    revenue: 450000000,
    employees: 3200,
    accountManagerId: "U-001",
    customerSegment: "Enterprise",
    customerStatus: "Active Customer",
  },
  {
    accountId: "A-002",
    accountName: "Meridian Financial Group",
    industry: "Financial Services",
    country: "United States",
    region: "Americas",
    revenue: 900000000,
    employees: 6100,
    accountManagerId: "U-003",
    customerSegment: "Enterprise",
    customerStatus: "Active Customer",
  },
  {
    accountId: "A-003",
    accountName: "Sunrise Retail Holdings",
    industry: "Retail",
    country: "United Kingdom",
    region: "Europe",
    revenue: 210000000,
    employees: 1800,
    accountManagerId: "U-001",
    customerSegment: "Mid-Market",
    customerStatus: "Active Customer",
  },
  {
    accountId: "A-004",
    accountName: "Pacific Rim Logistics",
    industry: "Logistics",
    country: "Singapore",
    region: "APAC",
    revenue: 320000000,
    employees: 2400,
    accountManagerId: "U-002",
    customerSegment: "Enterprise",
    customerStatus: "Active Customer",
  },
  {
    accountId: "A-005",
    accountName: "Northwind Manufacturing",
    industry: "Manufacturing",
    country: "Canada",
    region: "Americas",
    revenue: 150000000,
    employees: 1200,
    accountManagerId: "U-003",
    customerSegment: "Mid-Market",
    customerStatus: "Prospect",
  },
  {
    accountId: "A-006",
    accountName: "Zenith Health Systems",
    industry: "Healthcare",
    country: "Australia",
    region: "APAC",
    revenue: 275000000,
    employees: 2000,
    accountManagerId: "U-005",
    customerSegment: "Enterprise",
    customerStatus: "Active Customer",
  },
  {
    accountId: "A-007",
    accountName: "Bluewave Telecom",
    industry: "Telecom",
    country: "Spain",
    region: "Europe",
    revenue: 180000000,
    employees: 1500,
    accountManagerId: "U-001",
    customerSegment: "Mid-Market",
    customerStatus: "Prospect",
  },
  {
    accountId: "A-008",
    accountName: "Cascade Energy Partners",
    industry: "Energy",
    country: "United States",
    region: "Americas",
    revenue: 520000000,
    employees: 3400,
    accountManagerId: "U-003",
    customerSegment: "Enterprise",
    customerStatus: "Active Customer",
  },
];

export const contacts = [
  { contactId: "C-001", accountId: "A-001", firstName: "Anna", lastName: "Muller", jobTitle: "CTO", email: "anna.muller@abccorp.example", phone: "+49-30-1234567", department: "Technology", decisionMakingRole: "Decision Maker" },
  { contactId: "C-002", accountId: "A-001", firstName: "Lukas", lastName: "Becker", jobTitle: "Procurement Manager", email: "lukas.becker@abccorp.example", phone: "+49-30-1234568", department: "Procurement", decisionMakingRole: "Influencer" },
  { contactId: "C-003", accountId: "A-002", firstName: "Michael", lastName: "Reed", jobTitle: "VP of Operations", email: "michael.reed@meridianfg.example", phone: "+1-212-555-0110", department: "Operations", decisionMakingRole: "Decision Maker" },
  { contactId: "C-004", accountId: "A-002", firstName: "Laura", lastName: "Chen", jobTitle: "Data Analyst", email: "laura.chen@meridianfg.example", phone: "+1-212-555-0111", department: "Analytics", decisionMakingRole: "Influencer" },
  { contactId: "C-005", accountId: "A-003", firstName: "James", lastName: "Whitfield", jobTitle: "Head of IT", email: "james.whitfield@sunriseretail.example", phone: "+44-20-7946-0011", department: "IT", decisionMakingRole: "Decision Maker" },
  { contactId: "C-006", accountId: "A-004", firstName: "Mei", lastName: "Tan", jobTitle: "Supply Chain Director", email: "mei.tan@pacificrim.example", phone: "+65-6123-4567", department: "Supply Chain", decisionMakingRole: "Decision Maker" },
  { contactId: "C-007", accountId: "A-005", firstName: "Robert", lastName: "Klein", jobTitle: "Plant Manager", email: "robert.klein@northwindmfg.example", phone: "+1-416-555-0199", department: "Operations", decisionMakingRole: "Influencer" },
  { contactId: "C-008", accountId: "A-006", firstName: "Olivia", lastName: "Parker", jobTitle: "Chief Medical Information Officer", email: "olivia.parker@zenithhealth.example", phone: "+61-2-9876-5432", department: "Clinical IT", decisionMakingRole: "Decision Maker" },
  { contactId: "C-009", accountId: "A-007", firstName: "Diego", lastName: "Fernandez", jobTitle: "Network Operations Lead", email: "diego.fernandez@bluewave.example", phone: "+34-91-123-4567", department: "Network Ops", decisionMakingRole: "Influencer" },
  { contactId: "C-010", accountId: "A-008", firstName: "Grace", lastName: "Okafor", jobTitle: "VP Digital Transformation", email: "grace.okafor@cascadeenergy.example", phone: "+1-713-555-0142", department: "Digital", decisionMakingRole: "Decision Maker" },
];

export const leads = [
  { leadId: "L-001", companyName: "Harbor Point Insurance", contactName: "Nathan Price", email: "nathan.price@harborpoint.example", leadSource: "Website", leadStatus: "New", ownerId: "U-002", createdDate: daysAgo(4), industry: "Insurance", companySize: 900, engagementScore: 62 },
  { leadId: "L-002", companyName: "Greenfield Agritech", contactName: "Sofia Rossi", email: "sofia.rossi@greenfield.example", leadSource: "Marketing Campaign", leadStatus: "Contacted", ownerId: "U-005", createdDate: daysAgo(11), industry: "Agriculture", companySize: 400, engagementScore: 48 },
  { leadId: "L-003", companyName: "Bluewave Telecom", contactName: "Diego Fernandez", email: "diego.fernandez@bluewave.example", leadSource: "Referral", leadStatus: "Qualified", ownerId: "U-001", createdDate: daysAgo(28), industry: "Telecom", companySize: 1500, engagementScore: 88 },
  { leadId: "L-004", companyName: "Orion Aerospace", contactName: "Karen Liu", email: "karen.liu@orionaero.example", leadSource: "Trade Show", leadStatus: "New", ownerId: "U-003", createdDate: daysAgo(2), industry: "Aerospace", companySize: 5200, engagementScore: 55 },
  { leadId: "L-005", companyName: "Northwind Manufacturing", contactName: "Robert Klein", email: "robert.klein@northwindmfg.example", leadSource: "Marketing Campaign", leadStatus: "Qualified", ownerId: "U-003", createdDate: daysAgo(35), industry: "Manufacturing", companySize: 1200, engagementScore: 79 },
  { leadId: "L-006", companyName: "Summit Retail Co", contactName: "Alicia Gomez", email: "alicia.gomez@summitretail.example", leadSource: "Website", leadStatus: "Contacted", ownerId: "U-002", createdDate: daysAgo(9), industry: "Retail", companySize: 650, engagementScore: 41 },
  { leadId: "L-007", companyName: "Falcon Freight Systems", contactName: "Tom Baker", email: "tom.baker@falconfreight.example", leadSource: "Cold Outreach", leadStatus: "New", ownerId: "U-005", createdDate: daysAgo(1), industry: "Logistics", companySize: 800, engagementScore: 33 },
  { leadId: "L-008", companyName: "Vertex Health Analytics", contactName: "Nina Kovac", email: "nina.kovac@vertexhealth.example", leadSource: "Webinar", leadStatus: "Contacted", ownerId: "U-005", createdDate: daysAgo(15), industry: "Healthcare", companySize: 1100, engagementScore: 71 },
  { leadId: "L-009", companyName: "Ironclad Security Corp", contactName: "Ben Turner", email: "ben.turner@ironclad.example", leadSource: "Partner", leadStatus: "Disqualified", ownerId: "U-003", createdDate: daysAgo(40), industry: "Security", companySize: 300, engagementScore: 18 },
  { leadId: "L-010", companyName: "Cascade Energy Partners", contactName: "Grace Okafor", email: "grace.okafor@cascadeenergy.example", leadSource: "Referral", leadStatus: "Converted", ownerId: "U-003", createdDate: daysAgo(70), industry: "Energy", companySize: 3400, engagementScore: 92 },
];

export const opportunities = [
  { opportunityId: "O-001", accountId: "A-001", opportunityName: "ABC Corp - Product X Network Analytics Expansion", ownerId: "U-001", stage: "Negotiation", estimatedValue: 1000000, probability: 70, expectedCloseDate: daysFromNow(9), status: "Open", products: ["P-001", "P-005"], competitors: ["DataSphere Inc"], decisionMakers: ["Anna Muller"], risks: [], nextAction: "Confirm final pricing with procurement" },
  { opportunityId: "O-002", accountId: "A-001", opportunityName: "ABC Corp - Managed Support Renewal", ownerId: "U-001", stage: "Proposal", estimatedValue: 300000, probability: 55, expectedCloseDate: daysFromNow(21), status: "Open", products: ["P-004"], competitors: [], decisionMakers: ["Lukas Becker"], risks: [], nextAction: "Share updated proposal" },
  { opportunityId: "O-003", accountId: "A-002", opportunityName: "Meridian Financial - Customer Engagement Platform", ownerId: "U-003", stage: "Needs Analysis", estimatedValue: 850000, probability: 40, expectedCloseDate: daysFromNow(45), status: "Open", products: ["P-002"], competitors: ["Salesloop", "EngageIQ"], decisionMakers: [], risks: ["No confirmed decision maker"], nextAction: "Identify economic buyer" },
  { opportunityId: "O-004", accountId: "A-002", opportunityName: "Meridian Financial - AI Insights Add-on", ownerId: "U-003", stage: "Prospecting", estimatedValue: 180000, probability: 15, expectedCloseDate: daysFromNow(75), status: "Open", products: ["P-005"], competitors: [], decisionMakers: [], risks: [], nextAction: "Schedule discovery call" },
  { opportunityId: "O-005", accountId: "A-003", opportunityName: "Sunrise Retail - Cloud Billing Rollout", ownerId: "U-001", stage: "Proposal", estimatedValue: 620000, probability: 60, expectedCloseDate: daysFromNow(14), status: "Open", products: ["P-003"], competitors: ["BillWorks"], decisionMakers: ["James Whitfield"], risks: [], nextAction: "Follow up on proposal feedback" },
  { opportunityId: "O-006", accountId: "A-004", opportunityName: "Pacific Rim Logistics - Platform Expansion", ownerId: "U-002", stage: "Negotiation", estimatedValue: 940000, probability: 65, expectedCloseDate: daysFromNow(6), status: "Open", products: ["P-002", "P-006"], competitors: [], decisionMakers: ["Mei Tan"], risks: [], nextAction: "Finalize contract redlines" },
  { opportunityId: "O-007", accountId: "A-004", opportunityName: "Pacific Rim Logistics - Support Upsell", ownerId: "U-002", stage: "Qualification", estimatedValue: 150000, probability: 30, expectedCloseDate: daysFromNow(50), status: "Open", products: ["P-004"], competitors: [], decisionMakers: [], risks: [], nextAction: "Qualify budget and timeline" },
  { opportunityId: "O-008", accountId: "A-005", opportunityName: "Northwind Manufacturing - Analytics Suite", ownerId: "U-003", stage: "Needs Analysis", estimatedValue: 400000, probability: 35, expectedCloseDate: daysFromNow(60), status: "Open", products: ["P-001"], competitors: ["DataSphere Inc"], decisionMakers: [], risks: ["No recent activity"], nextAction: "Re-engage plant manager" },
  { opportunityId: "O-009", accountId: "A-006", opportunityName: "Zenith Health - Engagement Platform", ownerId: "U-005", stage: "Proposal", estimatedValue: 710000, probability: 55, expectedCloseDate: daysFromNow(18), status: "Open", products: ["P-002"], competitors: [], decisionMakers: ["Olivia Parker"], risks: [], nextAction: "Present ROI analysis" },
  { opportunityId: "O-010", accountId: "A-007", opportunityName: "Bluewave Telecom - New Logo Deal", ownerId: "U-001", stage: "Qualification", estimatedValue: 530000, probability: 25, expectedCloseDate: daysFromNow(80), status: "Open", products: ["P-001"], competitors: ["DataSphere Inc", "NetPulse"], decisionMakers: [], risks: [], nextAction: "Qualify budget authority" },
  { opportunityId: "O-011", accountId: "A-008", opportunityName: "Cascade Energy - Analytics + AI Bundle", ownerId: "U-003", stage: "Negotiation", estimatedValue: 1250000, probability: 75, expectedCloseDate: daysFromNow(11), status: "Open", products: ["P-001", "P-005", "P-006"], competitors: [], decisionMakers: ["Grace Okafor"], risks: [], nextAction: "Route contract for legal signoff" },
  { opportunityId: "O-012", accountId: "A-003", opportunityName: "Sunrise Retail - Closed Deal Q1", ownerId: "U-001", stage: "Closed Won", estimatedValue: 480000, probability: 100, expectedCloseDate: daysAgo(95), status: "Closed Won", products: ["P-002"], competitors: [], decisionMakers: ["James Whitfield"], risks: [], nextAction: "" },
  { opportunityId: "O-013", accountId: "A-002", opportunityName: "Meridian Financial - Legacy Platform Deal", ownerId: "U-003", stage: "Closed Lost", estimatedValue: 260000, probability: 0, expectedCloseDate: daysAgo(40), status: "Closed Lost", products: ["P-003"], competitors: ["BillWorks"], decisionMakers: [], risks: [], nextAction: "" },
  { opportunityId: "O-014", accountId: "A-001", opportunityName: "ABC Corp - Closed Deal Prior Year", ownerId: "U-001", stage: "Closed Won", estimatedValue: 5200000 / 2, estimatedValueLabel: "Historical", expectedCloseDate: daysAgo(210), status: "Closed Won", products: ["P-001"], competitors: [], decisionMakers: ["Anna Muller"], risks: [], nextAction: "" },
];

const activityTemplates = [
  { type: "Meeting", subject: "Customer meeting completed", description: "Discussed rollout timeline and technical requirements." },
  { type: "Proposal", subject: "Product proposal shared", description: "Sent updated commercial proposal for review." },
  { type: "Call", subject: "Customer requested technical demonstration", description: "Prospect asked to see a live demo of Product X." },
  { type: "Call", subject: "Initial customer discussion", description: "Introductory call to understand business needs." },
  { type: "Email", subject: "Follow-up email sent", description: "Sent recap and next steps after the last meeting." },
  { type: "Demo", subject: "Product demonstration delivered", description: "Walked through core platform capabilities with the team." },
  { type: "Task", subject: "Internal proposal review", description: "Reviewed pricing and terms ahead of customer proposal." },
  { type: "Meeting", subject: "Executive alignment session", description: "Met with sponsor to align on business case and ROI." },
];

export const activities = [
  { activityId: "AC-001", accountId: "A-001", opportunityId: "O-001", activityType: "Meeting", subject: "Customer meeting completed", description: "Reviewed rollout plan for Product X expansion.", activityDate: daysAgo(0), ownerId: "U-001" },
  { activityId: "AC-002", accountId: "A-001", opportunityId: "O-001", activityType: "Proposal", subject: "Product proposal shared", description: "Sent updated commercial proposal for expansion.", activityDate: daysAgo(2), ownerId: "U-001" },
  { activityId: "AC-003", accountId: "A-001", opportunityId: "O-001", activityType: "Call", subject: "Customer requested technical demonstration", description: "Anna requested a deeper technical walkthrough.", activityDate: daysAgo(5), ownerId: "U-001" },
  { activityId: "AC-004", accountId: "A-001", opportunityId: "O-001", activityType: "Call", subject: "Initial customer discussion", description: "Discussed expansion needs for additional regions.", activityDate: daysAgo(10), ownerId: "U-001" },
  { activityId: "AC-005", accountId: "A-001", opportunityId: "O-002", activityType: "Email", subject: "Renewal proposal follow-up", description: "Followed up on managed support renewal terms.", activityDate: daysAgo(3), ownerId: "U-001" },
  { activityId: "AC-006", accountId: "A-002", opportunityId: "O-003", activityType: "Meeting", subject: "Needs analysis workshop", description: "Workshop with operations team on requirements.", activityDate: daysAgo(38), ownerId: "U-003" },
  { activityId: "AC-007", accountId: "A-002", opportunityId: "O-004", activityType: "Email", subject: "Discovery call scheduling", description: "Emailed to schedule an initial discovery call.", activityDate: daysAgo(50), ownerId: "U-003" },
  { activityId: "AC-008", accountId: "A-003", opportunityId: "O-005", activityType: "Proposal", subject: "Billing rollout proposal shared", description: "Sent proposal covering phased billing rollout.", activityDate: daysAgo(4), ownerId: "U-001" },
  { activityId: "AC-009", accountId: "A-003", opportunityId: "O-005", activityType: "Meeting", subject: "Technical deep dive", description: "Reviewed integration architecture with IT team.", activityDate: daysAgo(12), ownerId: "U-001" },
  { activityId: "AC-010", accountId: "A-004", opportunityId: "O-006", activityType: "Meeting", subject: "Contract redline review", description: "Walked through redlines with legal and procurement.", activityDate: daysAgo(1), ownerId: "U-002" },
  { activityId: "AC-011", accountId: "A-004", opportunityId: "O-006", activityType: "Call", subject: "Pricing discussion", description: "Discussed volume discount structure.", activityDate: daysAgo(6), ownerId: "U-002" },
  { activityId: "AC-012", accountId: "A-004", opportunityId: "O-007", activityType: "Task", subject: "Qualification checklist started", description: "Began budget and authority qualification.", activityDate: daysAgo(20), ownerId: "U-002" },
  { activityId: "AC-013", accountId: "A-005", opportunityId: "O-008", activityType: "Email", subject: "Re-engagement email sent", description: "Reached out after a period of inactivity.", activityDate: daysAgo(36), ownerId: "U-003" },
  { activityId: "AC-014", accountId: "A-006", opportunityId: "O-009", activityType: "Demo", subject: "Product demonstration delivered", description: "Live demo of the Customer Engagement Platform.", activityDate: daysAgo(7), ownerId: "U-005" },
  { activityId: "AC-015", accountId: "A-006", opportunityId: "O-009", activityType: "Meeting", subject: "Executive alignment session", description: "Aligned with CMIO on business case and ROI.", activityDate: daysAgo(15), ownerId: "U-005" },
  { activityId: "AC-016", accountId: "A-007", opportunityId: "O-010", activityType: "Call", subject: "Initial customer discussion", description: "Introductory call with network operations lead.", activityDate: daysAgo(9), ownerId: "U-001" },
  { activityId: "AC-017", accountId: "A-008", opportunityId: "O-011", activityType: "Meeting", subject: "Legal review kickoff", description: "Kicked off contract legal review process.", activityDate: daysAgo(2), ownerId: "U-003" },
  { activityId: "AC-018", accountId: "A-008", opportunityId: "O-011", activityType: "Proposal", subject: "Bundle proposal finalized", description: "Finalized the analytics + AI bundle proposal.", activityDate: daysAgo(8), ownerId: "U-003" },
  { activityId: "AC-019", accountId: "A-001", opportunityId: null, activityType: "Meeting", subject: "Quarterly business review", description: "QBR covering account health and roadmap.", activityDate: daysAgo(30), ownerId: "U-001" },
  { activityId: "AC-020", accountId: "A-003", opportunityId: null, activityType: "Call", subject: "Support escalation follow-up", description: "Followed up on an open support ticket.", activityDate: daysAgo(18), ownerId: "U-001" },
];

export const salesTargets = [
  { targetId: "ST-001", salesPersonId: "U-001", period: "2026-Q3", targetAmount: 3000000 },
  { targetId: "ST-002", salesPersonId: "U-002", period: "2026-Q3", targetAmount: 2200000 },
  { targetId: "ST-003", salesPersonId: "U-003", period: "2026-Q3", targetAmount: 3500000 },
  { targetId: "ST-004", salesPersonId: "U-005", period: "2026-Q3", targetAmount: 2000000 },
  { targetId: "ST-005", salesPersonId: "ALL", period: "2026-Q3", targetAmount: 10000000 },
];

export const aiInsights = [];

export const auditHistory = [
  { auditId: "AU-001", entityType: "Opportunity", entityId: "O-001", action: "Update", oldValue: "Stage: Proposal", newValue: "Stage: Negotiation", changedBy: "U-001", changedDate: daysAgo(2) },
  { auditId: "AU-002", entityType: "Lead", entityId: "L-010", action: "Convert", oldValue: "Status: Qualified", newValue: "Status: Converted", changedBy: "U-003", changedDate: daysAgo(70) },
  { auditId: "AU-003", entityType: "Opportunity", entityId: "O-013", action: "Update", oldValue: "Status: Open", newValue: "Status: Closed Lost", changedBy: "U-003", changedDate: daysAgo(40) },
];

export { nextId };
