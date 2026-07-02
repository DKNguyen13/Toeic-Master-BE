// Normalize text: lowercase, remove accents, remove special chars, collapse spaces
const normalize = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Helper: check if any keyword matches
const hasKeyword = (text, keywords) =>
    keywords.some((k) => text.includes(k));

export const handleStaticIntent = (message, packageListText, lessonListText) => {
    const text = normalize(message);

    // Vip package
    if (hasKeyword(text, ["nang cap", "premium", "vip", "basic", "advanced", "goi", "tai khoan"])) {
        return `Chào bạn! Bạn muốn nâng cấp tài khoản đúng không?
        👉 Bạn vui lòng truy cập vào mục "Premium"

        Hệ thống đang có các gói sau:
        ${packageListText}

        Bạn hãy chọn gói phù hợp và thanh toán là xong! Nếu cần hỗ trợ thêm, cứ hỏi mình nhé 😊`;
    }

    // Lesson information
    if (hasKeyword(text, ["khoa hoc", "bai hoc"])) {
        return `Chào bạn! Toeic Master cung cấp nhiều khóa học luyện TOEIC hiệu quả:
        - Bao gồm cả bài miễn phí và nâng cao
        - Lộ trình từ cơ bản đến nâng cao
        - Hệ thống flashcard đa chế độ giúp ghi nhớ từ vựng hiệu quả mà không bị nhàm chán
        - Chế độ nghe – chép chính tả (dành cho Premium)
        - Luyện Listening & Reading sát đề thi thật

        Các bài học miễn phí:
        ${lessonListText.split("\n").map((l) => `• ${l}`).join("\n")}

        Các bài học nâng cao sẽ được mở khóa khi bạn nâng cấp tài khoản. Hãy nâng cấp để nhận thêm nhiều tính năng hỗ trợ học tập nhé! 😉`;
    }

    // Report
    if (hasKeyword(text, ["bao loi", "su co", "bi loi", "gap loi"])) {
        return `Hệ thống hiện đang bảo trì hoặc gặp sự cố tạm thời. Chúng tôi xin lỗi vì trải nghiệm chưa tốt.
        Bạn có thể vào mục "Hỗ trợ & liên hệ" trên website:
        - Điền thông tin vấn đề bạn gặp phải
        - Gửi về cho quản trị viên
        👉 Chúng tôi sẽ kiểm tra và phản hồi qua email trong vòng 24 giờ. Cảm ơn bạn đã thông cảm!`;
    }

    // About us
    if (hasKeyword(text, ["ve chung toi", "gioi thieu"])) {
        return `Chào bạn! Toeic Master là nền tảng học tiếng Anh luyện thi TOEIC bài bản và hiệu quả. Mục đích chính của chúng tôi là giúp các bạn tiếp cận tiếng Anh một cách dễ dàng và đạt kết quả cao hơn.
        - Lộ trình học rõ ràng
        - Bài tập sát đề thi thật
        - Phù hợp từ người mới đến nâng cao
        - Hệ thống flashcard hiệu quả với hơn 1000 từ vựng có sẵn
        - Chế độ luyện nghe, chép chính tả và luyện phát âm hiệu quả
        👉 Mục tiêu của chúng tôi là giúp bạn đạt điểm TOEIC mong muốn nhanh nhất. Cảm ơn các bạn đã đồng hành cùng chúng tôi!`;
    }

    return null;
};