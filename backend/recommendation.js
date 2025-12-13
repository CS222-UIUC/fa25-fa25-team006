function computeUserProfile(interactions) {
  if (!interactions || interactions.length === 0) {
    return null;
  }

  const foundInteractions = interactions.filter(i => i.interaction_type === 'found');
  const otherInteractions = interactions.filter(i => i.interaction_type !== 'found');

  const categoryWeights = {};
  let totalWeight = 0;
  const FOUND_WEIGHT_MULTIPLIER = 5.0;

  const difficulties = [];
  const difficultyWeights = [];

  const foundLocations = [];

  for (const interaction of foundInteractions) {
    const baseWeight = interaction.interaction_weight || 3.0;
    const weight = baseWeight * FOUND_WEIGHT_MULTIPLIER;
    totalWeight += weight;

    const catId = interaction.category_id;
    if (catId) {
      categoryWeights[catId] = (categoryWeights[catId] || 0) + weight;
    }

    if (interaction.difficulty != null) {
      difficulties.push(interaction.difficulty);
      difficultyWeights.push(weight);
    }

    if (interaction.latitude != null && interaction.longitude != null) {
      foundLocations.push({
        lat: Number(interaction.latitude),
        lng: Number(interaction.longitude),
        weight: weight,
      });
    }
  }

  for (const interaction of otherInteractions) {
    const weight = interaction.interaction_weight || 1.0;
    totalWeight += weight;

    const catId = interaction.category_id;
    if (catId) {
      categoryWeights[catId] = (categoryWeights[catId] || 0) + weight;
    }

    if (interaction.difficulty != null) {
      difficulties.push(interaction.difficulty);
      difficultyWeights.push(weight);
    }
  }

  const categoryScores = {};
  for (const [catId, weight] of Object.entries(categoryWeights)) {
    categoryScores[catId] = totalWeight > 0 ? weight / totalWeight : 0;
  }

  let difficultyMean = 0;
  let difficultyStdDev = 0;

  if (difficulties.length > 0) {
    let weightedSum = 0;
    let weightSum = 0;
    for (let i = 0; i < difficulties.length; i++) {
      const w = difficultyWeights[i] || 1.0;
      weightedSum += difficulties[i] * w;
      weightSum += w;
    }
    difficultyMean = weightSum > 0 ? weightedSum / weightSum : 0;

    let varianceSum = 0;
    for (let i = 0; i < difficulties.length; i++) {
      const w = difficultyWeights[i] || 1.0;
      const diff = difficulties[i] - difficultyMean;
      varianceSum += w * diff * diff;
    }
    const variance = weightSum > 0 ? varianceSum / weightSum : 0;
    difficultyStdDev = Math.sqrt(variance);
  }

  const locationClusters = computeLocationClusters(foundLocations);

  return {
    categoryScores,
    difficultyMean,
    difficultyStdDev,
    locationClusters,
    foundLocations,
    totalInteractions: interactions.length,
    totalWeight,
  };
}

function computeLocationClusters(locations) {
  if (!locations || locations.length === 0) {
    return [];
  }

  if (locations.length <= 3) {
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;
    for (const loc of locations) {
      const w = loc.weight || 1.0;
      totalWeight += w;
      weightedLat += loc.lat * w;
      weightedLng += loc.lng * w;
    }
    if (totalWeight > 0) {
      return [{
        lat: weightedLat / totalWeight,
        lng: weightedLng / totalWeight,
        weight: totalWeight,
      }];
    }
    return [];
  }

  const CLUSTER_RADIUS = 0.0045;
  const clusters = [];

  for (const loc of locations) {
    let assigned = false;
    for (const cluster of clusters) {
      const distance = haversineDistance(
        loc.lat, loc.lng,
        cluster.lat, cluster.lng
      );
      if (distance <= CLUSTER_RADIUS) {
        const totalWeight = cluster.weight + (loc.weight || 1.0);
        cluster.lat = (cluster.lat * cluster.weight + loc.lat * (loc.weight || 1.0)) / totalWeight;
        cluster.lng = (cluster.lng * cluster.weight + loc.lng * (loc.weight || 1.0)) / totalWeight;
        cluster.weight = totalWeight;
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      clusters.push({
        lat: loc.lat,
        lng: loc.lng,
        weight: loc.weight || 1.0,
      });
    }
  }

  return clusters;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  return distanceKm / 111;
}

function computeCategoryScore(cacheCategoryId, categoryScores) {
  if (!categoryScores || Object.keys(categoryScores).length === 0) {
    return 0.5;
  }

  return categoryScores[cacheCategoryId] || 0;
}

function computeDifficultyScore(cacheDifficulty, preferredMean, preferredStdDev) {
  if (preferredStdDev === 0 || preferredStdDev == null) {
    const distance = Math.abs(cacheDifficulty - preferredMean);
    return Math.max(0, 1 - distance / 5);
  }

  const distance = Math.abs(cacheDifficulty - preferredMean);
  const scaledDistance = distance / (preferredStdDev + 0.5);
  const score = Math.exp(-0.5 * scaledDistance * scaledDistance);
  
  return Math.max(0, Math.min(1, score));
}

function computePopularityScore(interactionCount, maxInteractions) {
  if (maxInteractions === 0 || maxInteractions == null) {
    return 0.5;
  }

  const normalized = interactionCount / maxInteractions;
  const logScore = Math.log(1 + normalized * 9) / Math.log(10);
  
  return logScore;
}

function computeLocationScore(cacheLat, cacheLng, locationClusters, foundLocations) {
  if (!locationClusters || locationClusters.length === 0) {
    return 0.5;
  }

  let totalScore = 0;
  let totalWeight = 0;

  for (const cluster of locationClusters) {
    const distance = haversineDistance(
      cacheLat, cacheLng,
      cluster.lat, cluster.lng
    );
    
    const SCALE_FACTOR = 0.02;
    const proximityScore = Math.exp(-distance / SCALE_FACTOR);
    
    const clusterWeight = cluster.weight || 1.0;
    totalScore += proximityScore * clusterWeight;
    totalWeight += clusterWeight;
  }

  const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  
  return Math.max(0, Math.min(1, normalizedScore));
}

async function getRecommendations(pool, userId, limit = 10) {
  try {
    const [findLogs] = await pool.query(
      `SELECT 
          f.cache_id,
          c.category_id,
          c.difficulty,
          c.latitude,
          c.longitude,
          'found' AS interaction_type,
          3.0 AS interaction_weight,
          f.found_at AS created_at
       FROM FIND_LOGS f
       JOIN CACHES c ON f.cache_id = c.cache_id
       WHERE f.finder_id = ?`,
      [userId]
    );

    let additionalInteractions = [];
    try {
      const [interactions] = await pool.query(
        `SELECT 
            uci.cache_id,
            c.category_id,
            c.difficulty,
            c.latitude,
            c.longitude,
            uci.interaction_type,
            COALESCE(uci.interaction_weight, 
              CASE uci.interaction_type
                WHEN 'favorite' THEN 2.5
                WHEN 'view' THEN 1.0
                WHEN 'visit' THEN 1.5
                ELSE 1.0
              END) AS interaction_weight,
            uci.created_at
         FROM USER_CACHE_INTERACTIONS uci
         JOIN CACHES c ON uci.cache_id = c.cache_id
         WHERE uci.user_id = ?`,
        [userId]
      );
      additionalInteractions = interactions;
    } catch (err) {
      console.log("USER_CACHE_INTERACTIONS table not found, using FIND_LOGS only");
    }

    const allInteractions = [...findLogs, ...additionalInteractions];

    const userProfile = computeUserProfile(allInteractions);

    if (!userProfile || userProfile.totalInteractions === 0) {
      return await getFallbackRecommendations(pool, userId, limit);
    }

    const [candidates] = await pool.query(
      `SELECT 
          c.cache_id AS id,
          c.title,
          c.latitude,
          c.longitude,
          c.difficulty,
          c.category_id,
          cat.name AS category,
          c.owner_id AS creator_id,
          c.is_active,
          c.created_at,
          (SELECT COUNT(*) FROM FIND_LOGS f2 WHERE f2.cache_id = c.cache_id) +
          COALESCE(
            (SELECT COUNT(*) FROM USER_CACHE_INTERACTIONS uci2 
             WHERE uci2.cache_id = c.cache_id),
            0
          ) AS total_interactions
       FROM CACHES c
       JOIN CATEGORIES cat ON c.category_id = cat.category_id
       WHERE c.is_active = 1
         AND c.owner_id != ?
         AND c.cache_id NOT IN (
           SELECT DISTINCT cache_id FROM FIND_LOGS WHERE finder_id = ?
         )
       ORDER BY c.created_at DESC
       LIMIT 100`,
      [userId, userId]
    );

    if (candidates.length === 0) {
      return [];
    }

    const maxInteractions = Math.max(
      ...candidates.map(c => c.total_interactions || 0),
      1
    );

    const WEIGHT_CATEGORY = 0.35;
    const WEIGHT_DIFFICULTY = 0.30;
    const WEIGHT_LOCATION = 0.25;
    const WEIGHT_POPULARITY = 0.10;

    const scoredCaches = candidates.map(cache => {
      const catScore = computeCategoryScore(
        cache.category_id,
        userProfile.categoryScores
      );

      const diffScore = computeDifficultyScore(
        cache.difficulty,
        userProfile.difficultyMean,
        userProfile.difficultyStdDev
      );

      const locScore = computeLocationScore(
        cache.latitude,
        cache.longitude,
        userProfile.locationClusters,
        userProfile.foundLocations
      );

      const popScore = computePopularityScore(
        cache.total_interactions || 0,
        maxInteractions
      );

      const compositeScore =
        WEIGHT_CATEGORY * catScore +
        WEIGHT_DIFFICULTY * diffScore +
        WEIGHT_LOCATION * locScore +
        WEIGHT_POPULARITY * popScore;

      return {
        ...cache,
        recommendation_score: compositeScore,
        score_breakdown: {
          category: catScore,
          difficulty: diffScore,
          location: locScore,
          popularity: popScore,
        },
      };
    });

    scoredCaches.sort((a, b) => b.recommendation_score - a.recommendation_score);

    return scoredCaches.slice(0, limit);
  } catch (err) {
    console.error("Error in getRecommendations:", err);
    throw err;
  }
}

async function getFallbackRecommendations(pool, userId, limit) {
  const [caches] = await pool.query(
    `SELECT 
        c.cache_id AS id,
        c.title,
        c.latitude,
        c.longitude,
        c.difficulty,
        c.category_id,
        cat.name AS category,
        c.owner_id AS creator_id,
        c.is_active,
        c.created_at,
        (SELECT COUNT(*) FROM FIND_LOGS f WHERE f.cache_id = c.cache_id) AS total_interactions,
        0.5 AS recommendation_score
     FROM CACHES c
     JOIN CATEGORIES cat ON c.category_id = cat.category_id
     WHERE c.is_active = 1
       AND c.owner_id != ?
     ORDER BY total_interactions DESC, c.created_at DESC
     LIMIT ?`,
    [userId, limit]
  );

  return caches;
}

module.exports = {
  getRecommendations,
  computeUserProfile,
  computeCategoryScore,
  computeDifficultyScore,
  computePopularityScore,
};
