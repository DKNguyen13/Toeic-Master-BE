import { Groq } from "groq-sdk";
import { config } from "../config/env.config.js";

const groq = new Groq({ apiKey: config.groqApiKey });

export const chatWithGroq = async (req, res) => {
    let { message } = req.body;
    const systemPrompt = "Hãy hình dung bạn là một người thầy dạy học tiếng Anh, bạn hãy trả lời câu hỏi bên dưới ngắn gọn và dễ hiểu. " +
        "Nếu như câu hỏi không liên quan đến tiếng Anh, hãy từ chối trả lời một cách lịch sự. Bạn chỉ trả lời thôi, đừng giới thiệu bạn là ai.";

    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            temperature: 0.5,
            max_tokens: 1024,
        });

        const text = response.choices[0]?.message?.content || "";
        res.json({ data: text });
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};