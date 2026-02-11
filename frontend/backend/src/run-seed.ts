
import { seedDatabase } from "./db/seed";
import "dotenv/config";

seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Seed failed:", err);
        process.exit(1);
    });
