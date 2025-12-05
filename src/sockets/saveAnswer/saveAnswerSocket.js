import { submitBulkAnswers } from "../../services/sessionTest/sessionTest.service.js";

let io = null;

export function initSaveAnswersSocket(ioInstance) {
  io = ioInstance;

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // --- 1) Register session ---
    socket.on("register_session", ({ userId, sessionId }) => {
      if (!userId || !sessionId) {
        console.warn("register_session missing userId or sessionId");
        return;
      }

      socket.userId = userId;
      socket.sessionId = sessionId;

      socket.join(sessionId);

      console.log(`Socket ${socket.id} joined session ${sessionId}`);
    });

    // --- 2) Nhận submit_answer và lưu ngay ---
    socket.on("submit_answer", async ({ sessionId, questionId, answer }) => {
      try {
        console.log('answer', answer);
        if (!questionId || !answer) {
          console.log("submit_answer missing questionId or answer");
          return;
        }

        const sid = sessionId || socket.sessionId;
        const uid = socket.userId;

        if (!sid || !uid) {
          socket.emit("answer_save_error", {
            questionId,
            error: "Missing userId or sessionId",
          });
          return;
        }

        // Gọi API lưu 1 câu trả lời
        await submitBulkAnswers(sid, uid, [
          {
            questionId,
            selectedAnswer: answer,
            timeSpent: 0,
            isFlagged: false,
          },
        ]);

        // Trả về ack cho FE
        socket.emit("answer_ack", {
          questionId,
          savedAt: Date.now(),
        });

      } catch (err) {
        console.error("submit_answer error:", err);
        socket.emit("answer_save_error", {
          questionId,
          error: err.message || "Save failed",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO() {
  return io;
}
