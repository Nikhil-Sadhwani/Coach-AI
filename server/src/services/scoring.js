/**
 * Lightweight answer scoring.
 * Replicated from the original Python scoring.py
 */

/**
 * Tokenize text.
 *
 * Python equivalent:
 * re.findall(r"\b\w+\b", (text or "").lower())
 */
const tokenize = (text) => {
  if (!text) {
    return [];
  }

  const matches = text.toLowerCase().match(/\b\w+\b/g);

  return matches || [];
};

/**
 * Build TF-IDF vectors.
 *
 * Python equivalent:
 * _tfidf_vectors(docs)
 */
const tfidfVectors = (docs) => {
  const n = docs.length;

  const df = {};

  // Calculate document frequency.
  for (const doc of docs) {
    const uniqueTerms = new Set(doc);

    for (const term of uniqueTerms) {
      df[term] = (df[term] || 0) + 1;
    }
  }

  const vectors = [];

  for (const doc of docs) {
    const tf = {};

    // Term frequency.
    for (const term of doc) {
      tf[term] = (tf[term] || 0) + 1;
    }

    const vec = {};

    for (const [term, count] of Object.entries(tf)) {
      // Same formula as Python:
      //
      // log((n + 1) / (df + 1)) + 1
      const idf =
        Math.log((n + 1) / ((df[term] || 0) + 1)) + 1;

      vec[term] = count * idf;
    }

    vectors.push(vec);
  }

  return vectors;
};

/**
 * Calculate cosine similarity between two vectors.
 *
 * Python equivalent:
 * _cosine_similarity(vec_a, vec_b)
 */
const cosineSimilarity = (vecA, vecB) => {
  const keys = new Set([
    ...Object.keys(vecA),
    ...Object.keys(vecB),
  ]);

  let dot = 0;

  for (const key of keys) {
    dot += (vecA[key] || 0) * (vecB[key] || 0);
  }

  let magA = 0;

  for (const value of Object.values(vecA)) {
    magA += value * value;
  }

  let magB = 0;

  for (const value of Object.values(vecB)) {
    magB += value * value;
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (magA * magB);
};

/**
 * Return 0–100 similarity between reference answer and user answer.
 *
 * Python equivalent:
 * answer_similarity_score(reference, answer)
 */
export const answerSimilarityScore = (reference, answer) => {
  const docs = [
    tokenize(reference),
    tokenize(answer),
  ];

  if (!docs[0].length || !docs[1].length) {
    return 0;
  }

  const vectors = tfidfVectors(docs);

  const similarity = cosineSimilarity(
    vectors[0],
    vectors[1]
  );

  return Math.round(similarity * 100);
};