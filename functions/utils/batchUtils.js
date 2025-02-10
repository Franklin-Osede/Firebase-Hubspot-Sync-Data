// Utilidad para procesar arrays en lotes
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

      // Separar resultados exitosos y errores
      batchResults.forEach(result => {
        if (result.success) {
          results.success.push(result);
        } else {
          results.errors.push(result);
        }
      });

      // Esperar un poco entre lotes para no sobrecargar Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error procesando lote ${i}-${i + batchSize}:`, error);
    }
  }

  return results;
};