import { success, error } from "../utils/response.js";
import { meiliClient } from "../config/meilisearch.config.js";

// Search user
export const searchUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return error(res, 'Không có quyền truy cập', 403);

        const query = req.query.q || "";
        const index = meiliClient.index("users");

        const result = await index.search(query, { limit: 20});
        const filteredHits = result.hits.filter(u => u.role !== "admin");
        return success(res, "", {hits: result.hits});
    } catch (err) {
        console.error("Search error:", err);
        return success(res, "Lỗi khi tìm kiếm");
    }
}