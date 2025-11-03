import fs from "fs";
import path from "path";

// === Load từ toxic từ JSON ===
let toxicWords = [];
const filePath = path.resolve("toxicWords.json");

try {
  const raw = fs.readFileSync(filePath, "utf-8");
  toxicWords = JSON.parse(raw);
  console.log(`Loaded ${toxicWords.length} toxic words from JSON`);
} catch (err) {
  console.error("Không đọc được file toxicWords.json:", err.message);
}

// === Chuẩn hóa comment ===
function normalizeText(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

// === Tạo regex fuzzy cho từng từ toxic ===
const toxicRegexes = toxicWords.map(word => {
  const escaped = word.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  // split từng ký tự, cho phép khoảng trắng hoặc ký tự đặc biệt giữa chữ
  const pattern = escaped
    .split("")
    .join("[\\s\\*\\@\\#\\$\\!]*");
  // \b để match nguyên từ, i: ignore case
  return new RegExp(`\\b${pattern}\\b`, "i");
});

// === Hàm check comment ===
export function checkToxic(comment) {
  if (!comment) return false;

  const text = normalizeText(comment);

  if (!toxicRegexes.length) {
    console.warn("Toxic regex list trống, không thể check comment!");
    return false;
  }

  for (let regex of toxicRegexes) {
    if (regex.test(text)) {
      //console.log(`Toxic detected! Comment: "${comment}" matched regex: ${regex}`);
      return true;
    }
  }

  console.log(`Comment safe: "${comment}"`);
  return false;
}
