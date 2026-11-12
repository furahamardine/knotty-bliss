// On the deployed site use /api/catalog. To use Sheets instead, paste its published CSV URL.
// A preview opened directly from disk uses the bundled sample titles.
const storeConfig = {
  whatsappNumber: "250789177052",
  demoInventory: true,
  inventoryCsvUrl: location.protocol === "file:" ? "" : "/api/catalog"
};
