import { submitBulkAnswers } from "../../services/sessionTest/sessionTest.service.js";

let io = null;

export function initSaveAnswersSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register_session", ({ userId, sessionId }) => {
      if (!userId || !sessionId) return;

      socket.userId = userId;
      socket.sessionId = sessionId;

      socket.join(sessionId);
    });

    /* ===== BULK ANSWER ===== */
    socket.on("submit_bulk_answer", async (answers) => {
      try {
        if (!Array.isArray(answers) || answers.length === 0) return;

        const sessionId = answers[0].sessionId || socket.sessionId;
        const userId = socket.userId;

        if (!sessionId || !userId) return;

        await submitBulkAnswers(sessionId, userId, answers);

        socket.emit("bulk_ack", {
          count: answers.length,
          savedAt: Date.now(),
        });
      } catch (err) {
        socket.emit("answer_save_error", {
          error: err.message,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

export function getIO() {
  return io;
}
