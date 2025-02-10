// Process arrays on batches
exports.processBatch = async (items, batchSize, processFunction) => {
  const results = {
    success: [],
    errors: []
  };

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    try {
      const batchResults = await Promise.all(
        batch.map(async (item) => {
          try {
            const result = await processFunction(item);
            return { success: true, item, result };
          } catch (error) {
            return { success: false, item, error: error.message };
          }
        })
      );

      // Separate successful results from failures
      batchResults.forEach(result => {
        if (result.success) {
          results.success.push(result);
        } else {
          results.errors.push(result);
        }
      });

      // Wait sometime between batches so I do not overload Firestore 
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error procesando lote ${i}-${i + batchSize}:`, error);
    }
  }

  return results;
};