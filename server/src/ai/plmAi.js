import { generateText, withAiFallback } from "./aiClient.js";

function heuristicSummary(doc) {
  const sentences = doc.content.split(/(?<=[.!?])\s+/).filter(Boolean);
  const summary = sentences.slice(0, 2).join(" ");
  return { summary: summary || doc.content.slice(0, 200) };
}

export async function summarizeDocument(doc) {
  return withAiFallback(
    async () => {
      const text = await generateText({
        system:
          "You summarize enterprise product-lifecycle-management documents (specs, compliance certs, manuals, drawings) into 2-3 concise sentences for a product manager. Be factual and specific to the content given.",
        prompt: `Document title: ${doc.title}\nType: ${doc.type}\n\nContent:\n${doc.content}\n\nWrite a 2-3 sentence summary.`,
        maxTokens: 300,
      });
      return { summary: text.trim() };
    },
    () => heuristicSummary(doc)
  );
}

// Simple token-overlap relevance score used for both the heuristic path and
// as the retrieval step feeding the RAG-style AI search (AI narrates results
// found by this deterministic search rather than hallucinating new ones).
function score(text, terms) {
  const lower = (text || "").toLowerCase();
  return terms.reduce((acc, t) => acc + (lower.includes(t) ? 1 : 0), 0);
}

export function searchCatalog(query, products, documents) {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const productResults = products
    .map((p) => ({
      type: "product",
      id: p.id,
      title: p.name,
      subtitle: `${p.sku} · ${p.category} · ${p.lifecycleStage}`,
      relevance: score([p.name, p.sku, p.category, p.description, ...(p.tags || [])].join(" "), terms),
    }))
    .filter((r) => r.relevance > 0);
  const documentResults = documents
    .map((d) => ({
      type: "document",
      id: d.id,
      title: d.title,
      subtitle: `${d.type} · v${d.version} · ${d.status}`,
      relevance: score([d.title, d.content, d.type].join(" "), terms),
    }))
    .filter((r) => r.relevance > 0);
  return [...productResults, ...documentResults].sort((a, b) => b.relevance - a.relevance);
}

export async function answerCatalogQuestion(question, { products, documents, changeRequests }) {
  const openCrByProduct = new Map();
  for (const cr of changeRequests) {
    if (cr.status === "Open" || cr.status === "In Review") {
      openCrByProduct.set(cr.productId, (openCrByProduct.get(cr.productId) || []).concat(cr));
    }
  }
  const eolStages = new Set(["Phase-Out", "End of Life"]);
  const atRisk = products
    .filter((p) => eolStages.has(p.lifecycleStage) && openCrByProduct.has(p.id))
    .map((p) => ({ product: p, changeRequests: openCrByProduct.get(p.id) }));

  const searchResults = searchCatalog(question, products, documents).slice(0, 6);

  const heuristicAnswer = () => {
    if (/end.?of.?life|eol|phase.?out/i.test(question)) {
      if (atRisk.length === 0) {
        return { answer: "No products approaching end-of-life currently have unresolved change requests." };
      }
      const lines = atRisk.map(
        ({ product, changeRequests: crs }) =>
          `${product.name} (${product.sku}, ${product.lifecycleStage}) has ${crs.length} unresolved change request(s): ${crs
            .map((c) => `"${c.title}" [${c.status}]`)
            .join("; ")}.`
      );
      return { answer: lines.join("\n") };
    }
    if (searchResults.length > 0) {
      return {
        answer: `Found ${searchResults.length} matching item(s): ${searchResults
          .map((r) => `${r.title} (${r.type})`)
          .join(", ")}.`,
      };
    }
    return { answer: "No matching products or documents were found for that query." };
  };

  return withAiFallback(
    async () => {
      const context = JSON.stringify(
        {
          matchingCatalogItems: searchResults,
          productsApproachingEndOfLifeWithOpenChangeRequests: atRisk.map(({ product, changeRequests: crs }) => ({
            product: product.name,
            sku: product.sku,
            lifecycleStage: product.lifecycleStage,
            openChangeRequests: crs.map((c) => ({ title: c.title, status: c.status, priority: c.priority })),
          })),
        },
        null,
        2
      );
      const text = await generateText({
        system:
          "You are an AI assistant embedded in an enterprise PLM (Product Lifecycle Management) application. Answer the user's question using ONLY the JSON context provided — do not invent products, documents, or change requests. Be concise (2-5 sentences) and reference specific product names/SKUs.",
        prompt: `Question: ${question}\n\nContext (retrieved from the product repository):\n${context}`,
        maxTokens: 500,
      });
      return { answer: text.trim(), matches: searchResults };
    },
    () => ({ ...heuristicAnswer(), matches: searchResults })
  );
}

// Duplicate detection: flags product pairs with high name/SKU similarity.
function similarity(a, b) {
  const na = a.toLowerCase().replace(/[^a-z0-9]/g, "");
  const nb = b.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (na === nb) return 1;
  const shorter = na.length < nb.length ? na : nb;
  const longer = na.length < nb.length ? nb : na;
  if (longer.includes(shorter) && shorter.length > 3) return 0.85;
  let matches = 0;
  for (const ch of new Set(shorter)) if (longer.includes(ch)) matches++;
  return matches / Math.max(na.length, nb.length, 1);
}

export function duplicateCandidates(products) {
  const pairs = [];
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const s = similarity(products[i].name, products[j].name);
      const sameSkuFamily = products[i].sku.split("-")[0] === products[j].sku.split("-")[0];
      if (s > 0.55 || (sameSkuFamily && s > 0.35)) {
        pairs.push({
          productA: products[i],
          productB: products[j],
          similarity: Math.round(s * 100),
          reason: sameSkuFamily
            ? "Shares SKU family prefix and similar naming."
            : "Highly similar product name.",
        });
      }
    }
  }
  return pairs.sort((a, b) => b.similarity - a.similarity);
}

export function dataQualityRecommendations(product, documents, changeRequests) {
  const recs = [];
  if (!product.description || product.description.length < 20) {
    recs.push("Description is missing or too short — add a detailed product description.");
  }
  if (!documents.some((d) => d.productId === product.id && d.type === "Compliance")) {
    recs.push("No compliance document on file — verify regulatory certification status.");
  }
  if (product.complianceStatus === "Review Required") {
    recs.push("Compliance status is 'Review Required' — schedule a compliance review.");
  }
  if ((product.lifecycleStage === "Phase-Out" || product.lifecycleStage === "End of Life")) {
    const openCrs = changeRequests.filter((c) => c.productId === product.id && c.status !== "Implemented");
    if (openCrs.length > 0) {
      recs.push(`Product is ${product.lifecycleStage} but has ${openCrs.length} unresolved change request(s).`);
    }
  }
  if (!product.tags || product.tags.length === 0) {
    recs.push("No tags assigned — add tags to improve searchability.");
  }
  return recs;
}
