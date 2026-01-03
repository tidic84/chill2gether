const cron = require("node-cron");
const roomModel = require("../model/roomModel");

/**
 * Service de nettoyage automatique des rooms inactives
 * Supprime les rooms vides et inactives depuis 1 heure
 */
function initRoomCleanup() {
  // Exécuter toutes les heures (à la minute 0)
  cron.schedule("0 * * * *", async () => {
    console.log("[Room Cleanup] Démarrage du nettoyage des rooms inactives...");

    try {
      const result = await roomModel.deleteInactiveRooms();

      if (result.deleted > 0) {
        console.log(`[Room Cleanup] ${result.deleted} room(s) supprimée(s):`);
        console.log(
          `  - ${result.details.emptyRooms} room(s) vide(s) et inactive(s) depuis 1h`,
        );
        console.log(
          `  - ${result.details.oldRooms} room(s) inactive(s) depuis 1 jour`,
        );
        console.log(`  - IDs: ${result.roomIds.join(", ")}`);
      } else {
        console.log("[Room Cleanup] Aucune room inactive à supprimer");
      }
    } catch (error) {
      console.error("[Room Cleanup] Erreur lors du nettoyage:", error);
    }
  });

  console.log("[Room Cleanup] Service de nettoyage activé (toutes les heures)");
}

module.exports = { initRoomCleanup };
