import userModel from "../models/user.model.js";
import { meiliClient } from "../config/meilisearch.config.js";

export const syncUsersToMeili = async () => {
  try {
    const index = meiliClient.index("users");
    await index.deleteAllDocuments();
    const users = await userModel.find(
      { role: { $ne: "admin" } },
      "_id fullname email phone role isActive authType"
    );
    const formatted = users.map(u => ({
      id: u._id.toString(),
      fullname: u.fullname,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      authType: u.authType
    }));

    await index.addDocuments(formatted);

    console.log(`Synced ${formatted.length} users to Meilisearch`);
  } catch (err) {
    console.error("Sync Meili error:", err);
  }
};
