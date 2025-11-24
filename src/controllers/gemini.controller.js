import { GoogleGenAI } from "@google/genai";
import { config } from "../config/env.config.js";

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

export const chatWithGemini = async (req, res) => {
    let {message} = req.body;
    const extraPrompt = "Hãy hình dung bạn là một người thầy dạy học tiếng anh, bạn hãy trả lời câu hỏi bên dưới ngắn gọn và dễ hiểu." +
        "Nếu như câu hỏi không liên quan đến tiếng anh, hãy từ chối trả lời một cách lịch sự. Bạn chỉ trả lời thôi, đừng giới thiệu bạn là ai"
    message = extraPrompt + message;
    try{

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: message,
        });
        const chat = ai.chats.create({
            model: 'gemini-2.0-flash',
            config: {
                temperature: 0.5,
                maxOutputTokens: 1024,
            }
        })
        res.json({data: response.text});
    }
    catch (error) {
        console.log(error);
        res.status(500).send(error)
    }
}
